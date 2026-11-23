#!/usr/bin/env python3
"""V6-full + H3 融合搜索：pnpm mix。配置冻结、逐局保存、原命令续跑。"""
import argparse
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor, as_completed
import fcntl
import hashlib
import json
import math
import multiprocessing
import os
from pathlib import Path
import platform
import random
import sys

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE.parents[2]))

import numpy as np
import torch

from python.games.gomoku.models import MANIFEST, REGISTRY
from python.games.gomoku.models.value_cnn import get_device
from python.games.gomoku.selfplay.game import play_one
from python.games.gomoku.train.config import WORKERS
from python.games.gomoku.train.mix import fingerprint, name_of, opening_key, openings, tasks_for

NEURAL = "nn-v6-full"
HEURISTIC = "heuristic-v3"
OLD_MIX = "mix-v5-h3"
PANEL = [OLD_MIX, HEURISTIC, "nn-v5-a2"]
DEVELOPMENT_PANEL = [NEURAL, *PANEL]
# 迁移后源码指纹变化；保留旧实验记录，后续实验使用新的输出目录。
CONFIRM_FROM = None
OUTPUT = BASE / "checkpoints/mix-v6-h3-after-layout"
RULES = {"bootstrap_samples": 10000, "bootstrap_seed": 0,
         "corrected_confidence": 0.9875, "minimum_duel_score": 0.55,
         "panel_noninferiority_margin": 0.03}


def save(path, data):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    temporary.replace(path)


def freeze(path, data):
    if path.exists():
        if json.loads(path.read_text()) != data:
            raise ValueError(f"{path.name} changed; use a new --output directory")
    else:
        save(path, data)


def candidate(weight=0.0, c_puct=1.2):
    value = {NEURAL: 1 - weight, HEURISTIC: weight} if weight else NEURAL
    return {"policy": NEURAL, "value": value, "c_puct": c_puct}


def weight_of(spec):
    return spec["value"][HEURISTIC] if isinstance(spec["value"], dict) else 0.0


def make_tasks(stage, matchups, prefixes, args):
    tasks = []
    for spec, opponent in matchups:
        opponent_name = name_of(opponent) if isinstance(opponent, dict) else opponent
        games = tasks_for(stage, [spec], [opponent_name], prefixes, args.seed, args.time_ms)
        for task in games:
            if isinstance(opponent, dict):
                task["model_specs"][opponent_name] = opponent
            task["record_timing"] = True
        tasks.extend(games)
    random.Random(args.seed).shuffle(tasks)
    return tasks


def confirmation_matchups(mix, baseline):
    matchups = [(spec, opponent) for spec in (mix, baseline) for opponent in PANEL]
    matchups.append((mix, baseline))
    if baseline != candidate():
        matchups.append((mix, candidate()))
    return matchups


def read_journal(path):
    records = {}
    if not path.exists():
        return records
    with path.open("rb+") as journal:
        while True:
            offset = journal.tell()
            line = journal.readline()
            if not line:
                break
            if not line.endswith(b"\n"):
                # 中断在写入中间时只丢弃未提交的末行，已提交损坏记录直接报错。
                journal.truncate(offset)
                print("[resume] discarded unfinished final journal line", flush=True)
                break
            row = json.loads(line)
            key = row["task"]["id"]
            if key in records:
                raise ValueError(f"duplicate result: {key}")
            records[key] = row
    return records


def init_worker():
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)


def run_tasks(stage, tasks, args, records):
    for task in tasks:
        if task["id"] in records and records[task["id"]]["task"] != task:
            raise ValueError(f"saved task changed: {task['id']}")
    pending = [task for task in tasks if task["id"] not in records]
    done = len(tasks) - len(pending)
    print(f"[{stage}] total={len(tasks)} remaining={len(pending)}", flush=True)
    if not pending:
        return
    with ProcessPoolExecutor(max_workers=args.workers, initializer=init_worker,
                             mp_context=multiprocessing.get_context("spawn")) as pool:
        futures = {pool.submit(play_one, task): task for task in pending}
        with (args.output / "games.jsonl").open("a") as journal:
            for future in as_completed(futures):
                task = futures[future]
                row = {"task": task, "result": future.result()}
                journal.write(json.dumps(row, allow_nan=False) + "\n")
                journal.flush()
                os.fsync(journal.fileno())
                records[task["id"]] = row
                done += 1
                result = row["result"]
                print(f"[{stage}] {done}/{len(tasks)} {task['candidate']} ({task['color']}) "
                      f"vs {task['opponent']}: {result['winner']} "
                      f"{result['num_moves']} moves {result['duration_ms'] / 1000:.1f}s", flush=True)


def interval(values):
    values = np.asarray(values, dtype=float)
    rng = np.random.default_rng(RULES["bootstrap_seed"])
    boot = rng.choice(values, size=(RULES["bootstrap_samples"], len(values))).mean(axis=1)
    alpha = (1 - RULES["corrected_confidence"]) / 2
    return {"estimate": float(values.mean()), "opening_clusters": len(values),
            "ci95": np.quantile(boot, [0.025, 0.975]).tolist(),
            "ci98_75": np.quantile(boot, [alpha, 1 - alpha]).tolist()}


def score(task, result):
    return 0.5 if result["winner"] == "draw" else float(result["winner"] == task["color"])


def wdl(scores):
    return {"games": len(scores), "score": sum(scores) / len(scores),
            "wdl": [scores.count(1), scores.count(0.5), scores.count(0)]}


def paired_scores(tasks, records):
    pairs = defaultdict(dict)
    for task in tasks:
        key = (task["candidate"], task["opponent"], task["opening_id"])
        if task["color"] in pairs[key]:
            raise ValueError(f"duplicate color in pair: {key}")
        pairs[key][task["color"]] = score(task, records[task["id"]]["result"])
    if any(set(colors) != {"black", "white"} for colors in pairs.values()):
        raise ValueError("incomplete color-swapped pair")
    return {key: sum(colors.values()) / 2 for key, colors in pairs.items()}


def summarize(tasks, records):
    pairs = paired_scores(tasks, records)
    grouped = defaultdict(list)
    for task in tasks:
        grouped[task["candidate"]].append(task)
    report = {}
    for name, games in grouped.items():
        colors, opponents, clusters = defaultdict(list), defaultdict(list), defaultdict(list)
        visits, quiet, durations, game_seconds = 0, 0, [], []
        for task in games:
            result = records[task["id"]]["result"]
            value = score(task, result)
            colors[task["color"]].append(value)
            opponents[task["opponent"]].append(value)
            game_seconds.append(result["duration_ms"] / 1000)
            parity = 0 if task["color"] == "black" else 1
            for ply, step in enumerate(result["policies"]):
                if ply % 2 != parity or step is None:
                    continue
                durations.append(step["elapsed_ms"])
                if not step["t"]:
                    visits += sum(step["d"].values())
                    quiet += 1
        for (who, _, opening), value in pairs.items():
            if who == name:
                clusters[opening].append(value)
        panel = interval([sum(clusters[k]) / len(clusters[k]) for k in sorted(clusters)])
        report[name] = {"games": len(games), "score": panel["estimate"], "interval": panel,
                        "by_color": {k: wdl(v) for k, v in colors.items()},
                        "by_opponent": {k: wdl(v) for k, v in opponents.items()},
                        "mean_visits_per_quiet_move": visits / quiet if quiet else None,
                        "mean_move_ms": float(np.mean(durations)) if durations else None,
                        "p95_move_ms": float(np.quantile(durations, 0.95)) if durations else None,
                        "mean_game_seconds": sum(game_seconds) / len(game_seconds)}
    return report


def rank(specs, report):
    def key(spec):
        stats = report[name_of(spec)]
        return (-stats["score"], -stats["by_opponent"][NEURAL]["score"], weight_of(spec),
                abs(spec["c_puct"] - 1.2), spec["c_puct"])
    return sorted(specs, key=key)


def develop(stage, specs, prefixes, args, records):
    tasks = make_tasks(stage, [(s, o) for s in specs for o in DEVELOPMENT_PANEL], prefixes, args)
    run_tasks(stage, tasks, args, records)
    report = summarize(tasks, records)
    ranked = rank(specs, report)
    save(args.output / f"{stage}.json", {"specs": {name_of(s): s for s in specs},
                                       "results": report, "ranking": [name_of(s) for s in ranked]})
    for spec in ranked:
        print(f"[{stage}] {report[name_of(spec)]['score']:.1%} {spec}", flush=True)
    return ranked


def confirm_report(tasks, records, mix, baseline):
    pairs = paired_scores(tasks, records)
    m, b = name_of(mix), name_of(baseline)
    ids = sorted({task["opening_id"] for task in tasks})
    direct = {}
    for opponent in [b, *PANEL, *([name_of(candidate())] if baseline != candidate() else [])]:
        direct[opponent] = interval([pairs[m, opponent, i] for i in ids])
    panel = {who: [sum(pairs[who, opponent, i] for opponent in PANEL) / len(PANEL)
                   for i in ids] for who in (m, b)}
    delta = interval([a - b for a, b in zip(panel[m], panel[b])])
    metrics = {"vs_tuned_v6": interval([pairs[m, b, i] - 0.5 for i in ids]),
               "vs_old_mix": interval([pairs[m, OLD_MIX, i] - 0.5 for i in ids]),
               "vs_h3": interval([pairs[m, HEURISTIC, i] - 0.5 for i in ids]),
               "panel_delta": delta}
    return {"results": summarize(tasks, records), "direct_scores": direct,
            "external_panel": {who: interval(values) for who, values in panel.items()},
            "metrics": metrics}


def decide(report, mix, baseline):
    metrics = report["metrics"]
    checks = {
        "duel_significant": metrics["vs_tuned_v6"]["ci98_75"][0] > 0,
        "duel_practical": metrics["vs_tuned_v6"]["estimate"] + 0.5 >= RULES["minimum_duel_score"],
        "panel_point_nonnegative": metrics["panel_delta"]["estimate"] >= 0,
        "panel_noninferior": metrics["panel_delta"]["ci98_75"][0] > -RULES["panel_noninferiority_margin"],
        "beats_old_mix": metrics["vs_old_mix"]["ci98_75"][0] > 0,
        "beats_h3": metrics["vs_h3"]["ci98_75"][0] > 0,
    }
    improved = all(checks[k] for k in ("duel_significant", "duel_practical",
                                      "panel_point_nonnegative", "panel_noninferior"))
    upgrade = improved and checks["beats_old_mix"] and checks["beats_h3"]
    return {"fusion_improved": improved, "teacher_upgrade_supported": upgrade,
            "panel_improved": metrics["panel_delta"]["ci98_75"][0] > 0,
            "recommended_teacher": "mix-v6-h3" if upgrade else OLD_MIX,
            "candidate_spec": mix, "tuned_baseline_spec": baseline, "checks": checks,
            "unmet_criteria": [k for k, passed in checks.items() if not passed],
            "metrics": metrics,
            "note": "Frozen single candidate; four opening-cluster intervals corrected by Bonferroni. "
                    "Unmet criteria do not by themselves prove fusion is ineffective."}


def make_config(args):
    used, historical = set(), {}
    for path in args.exclude_config:
        data = path.read_bytes()
        historical[str(path)] = hashlib.sha256(data).hexdigest()
        for stage in json.loads(data)["openings"].values():
            used.update(opening_key(moves) for moves in stage)
    rng = random.Random(args.seed)
    prefixes = {stage: openings(count, rng, used) for stage, count in
                (("screen", args.screen_pairs), ("tune", args.tune_pairs), ("confirm", args.confirm_pairs))}
    hashes = fingerprint()
    hashes[str(Path(__file__).relative_to(BASE))] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    return {"args": {**vars(args), "output": str(args.output),
                     "confirm_from": str(args.confirm_from) if args.confirm_from else None,
                     "exclude_config": [str(p) for p in args.exclude_config]},
            "openings": prefixes, "excluded_configs": historical, "fingerprints": hashes,
            "development_panel": DEVELOPMENT_PANEL, "external_panel": PANEL, "rules": RULES,
            "runtime": {"python": platform.python_version(), "platform": platform.platform(),
                        "torch": torch.__version__, "numpy": np.__version__, "device": str(get_device()),
                        "worker_threads": 1, "worker_interop_threads": 1}}


def search(args):
    if args.confirm_from:
        restart_confirmation(args)
        return
    config = make_config(args)
    freeze(args.output / "config.json", config)
    prefixes = config["openings"]
    records = read_journal(args.output / "games.jsonl")
    screen = develop("screen", [candidate(w) for w in [0.0, *args.weights]],
                     prefixes["screen"], args, records)
    screen_seconds = [row["result"]["duration_ms"] / 1000 for row in records.values()
                      if row["task"]["stage"] == "screen"]
    tune_games = 3 * len(args.c_puct) * len(DEVELOPMENT_PANEL) * args.tune_pairs * 2
    seconds_per_game = sum(screen_seconds) / len(screen_seconds)
    hours = [(tune_games + n * args.confirm_pairs * 2) * seconds_per_game / args.workers / 3600
             for n in (7, 8)]
    print(f"[budget] tune+confirm approximately {hours[0]:.1f}–{hours[1]:.1f} worker-adjusted hours "
          "at screen throughput (full stage budgets)", flush=True)
    weights = [weight_of(s) for s in screen if weight_of(s) > 0][:2]
    tune = develop("tune", [candidate(w, c) for w in [0.0, *weights] for c in args.c_puct],
                   prefixes["tune"], args, records)
    mix = next(s for s in tune if weight_of(s) > 0)
    baseline = next(s for s in tune if weight_of(s) == 0)
    matchups = confirmation_matchups(mix, baseline)
    freeze(args.output / "selection.json", {"candidate": mix, "baseline": baseline,
           "default_baseline": candidate(), "tune_ranking": [name_of(s) for s in tune],
           "matchups": [list(pair) for pair in matchups],
           "games": len(matchups) * len(prefixes["confirm"]) * 2})
    run_confirmation(args, mix, baseline, prefixes["confirm"], records)


def run_confirmation(args, mix, baseline, prefixes, records):
    tasks = make_tasks("confirm", confirmation_matchups(mix, baseline), prefixes, args)
    run_tasks("confirm", tasks, args, records)
    report = confirm_report(tasks, records, mix, baseline)
    save(args.output / "confirm.json", report)
    result = decide(report, mix, baseline)
    save(args.output / "result.json", result)
    if result["teacher_upgrade_supported"]:
        save(args.output / "teacher-manifest.json", {"mix-v6-h3": mix})
    print(f"[done] fusion_improved={result['fusion_improved']} "
          f"teacher_upgrade_supported={result['teacher_upgrade_supported']}", flush=True)
    print(f"[done] {args.output}; recommended teacher={result['recommended_teacher']}", flush=True)


def restart_confirmation(args):
    """Reuse frozen selection/openings, but collect confirmation in a separate run."""
    source = args.confirm_from
    if source == args.output:
        raise ValueError("--confirm-from requires a separate --output directory")
    original = json.loads((source / "config.json").read_text())
    selection = json.loads((source / "selection.json").read_text())
    # Search orchestration may change; game rules, models and weights must match.
    current = fingerprint()
    for path, digest in original["fingerprints"].items():
        if path not in ("train/mix.py", "train/mix_v6_h3.py") and current.get(path) != digest:
            raise ValueError(f"confirmation source model/game fingerprint changed: {path}")
    if original["rules"] != RULES or original["external_panel"] != PANEL:
        raise ValueError("confirmation source rules/panel changed")
    # Keep all experimental settings from the source; only workers/output change.
    inherited = {**original["args"], "workers": args.workers, "output": args.output,
                 "confirm_from": source,
                 "exclude_config": [Path(p) for p in original["args"]["exclude_config"]]}
    args = argparse.Namespace(**inherited)
    config = make_config(args)
    config["openings"] = original["openings"]
    config["confirmation_source"] = {
        "directory": str(source), "workers": original["args"]["workers"],
        "config_sha256": hashlib.sha256((source / "config.json").read_bytes()).hexdigest(),
        "selection": selection,
    }
    freeze(args.output / "config.json", config)
    freeze(args.output / "selection.json", selection)
    records = read_journal(args.output / "games.jsonl")
    run_confirmation(args, selection["candidate"], selection["baseline"],
                     original["openings"]["confirm"], records)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--workers", type=int, default=WORKERS)
    parser.add_argument("--confirm-from", type=Path, default=CONFIRM_FROM,
                        help="读取已完成 tune 的目录，在不同 --output 中重新确认；沿用原实验参数")
    parser.add_argument("--time-ms", type=int, default=5000)
    parser.add_argument("--screen-pairs", type=int, default=3)
    parser.add_argument("--tune-pairs", type=int, default=5)
    parser.add_argument("--confirm-pairs", type=int, default=50)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--weights", type=float, nargs="+", default=[0.125, 0.25, 0.5, 0.75, 1.0])
    parser.add_argument("--c-puct", type=float, nargs="+", default=[0.8, 1.2, 1.8])
    parser.add_argument("--exclude-config", type=Path, action="append", default=[],
                        help="额外排除的旧搜索 config.json；默认始终排除 mix-v5-h3")
    args = parser.parse_args(argv)
    if min(args.workers, args.time_ms, args.screen_pairs, args.tune_pairs, args.confirm_pairs) < 1:
        parser.error("workers/time-ms/pair counts must be positive")
    if (len(set(args.weights)) < 2 or len(set(args.weights)) != len(args.weights)
            or any(not 0 < w <= 1 for w in args.weights)):
        parser.error("weights must contain at least two distinct values in (0,1]; zero is added automatically")
    if (len(set(args.c_puct)) != len(args.c_puct)
            or any(not math.isfinite(c) or c <= 0 for c in args.c_puct)):
        parser.error("c-puct must contain distinct finite positive values")
    args.output = args.output.expanduser().resolve()
    if args.confirm_from:
        args.confirm_from = args.confirm_from.expanduser().resolve()
    args.exclude_config = list(dict.fromkeys(p.expanduser().resolve() for p in
                              [BASE / "checkpoints/mix-v5-h3/config.json", *args.exclude_config]))
    for name in DEVELOPMENT_PANEL:
        if name not in REGISTRY:
            parser.error(f"missing model: {name}")
    if json.loads(Path(MANIFEST).read_text())[NEURAL].get("c_puct", 1.2) != 1.2:
        parser.error("development panel requires nn-v6-full c_puct=1.2")
    return args


def main():
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with (args.output / ".lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        search(args)


if __name__ == "__main__":
    main()
