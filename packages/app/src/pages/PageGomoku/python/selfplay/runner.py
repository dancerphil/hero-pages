import argparse
import concurrent.futures
from importlib import import_module
import os
import sys
import time
from datetime import datetime

from .db import (ensure_schema, existing_counts, insert_game, list_models,
                 print_ratings, select_batch_id)
from .elo import recompute_elo
from .io import redirect_to_log
from .tasks import build_tasks


def _parse_models(value, game):
    if value is None:
        return list_models(game)
    if isinstance(value, list):
        return value
    return [model.strip() for model in value.split(",") if model.strip()]


def build_parser():
    parser = argparse.ArgumentParser(description="headless game selfplay")
    parser.add_argument("--game", default="gomoku")
    parser.add_argument("--mode", required=True)
    return parser


def _validate_models(models, game):
    available = set(list_models(game))
    unknown = [model for model in models if model not in available]
    if unknown:
        print(f"unknown model: {unknown}, available: {sorted(available)}", file=sys.stderr)
        raise SystemExit(1)


def _pending_tasks(con, tasks, batch_id):
    done = existing_counts(con, batch_id)
    seen = {}
    pending = []
    skipped = 0
    for task in tasks:
        key = (task["black_model"], task["white_model"])
        n = seen.get(key, 0)
        if n < done.get(key, 0):
            seen[key] = n + 1
            skipped += 1
            continue
        seen[key] = n + 1
        pending.append(task)
    return pending, skipped


def _run(con, tasks, batch_id, skipped, play_one, workers, log_dir, time_limit_ms):
    total = len(tasks) + skipped
    pending_count = len(tasks)
    log_path = os.path.join(log_dir, f"selfplay-{batch_id}.log")
    os.makedirs(log_dir, exist_ok=True)
    log_file = redirect_to_log(log_path)
    print(f"[selfplay] logging to {log_path}")
    started_all = time.monotonic()
    finished = skipped
    try:
        with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
            future_to_task = {pool.submit(play_one, task): task for task in tasks}
            for future in concurrent.futures.as_completed(future_to_task):
                task = future_to_task[future]
                try:
                    result = future.result()
                    con.execute("BEGIN IMMEDIATE")
                    insert_game(con, batch_id, result, time_limit_ms)
                    con.execute("COMMIT")
                except Exception as error:  # noqa: BLE001
                    print(f"[selfplay] ERROR {task['black_model']} vs {task['white_model']}: {error}",
                          file=sys.stderr, flush=True)
                    continue
                finished += 1
                elapsed = time.monotonic() - started_all
                eta = elapsed / max(1, finished - skipped) * (pending_count - (finished - skipped))
                print(f"[selfplay] [{finished}/{total}] black={result['black_model']} "
                      f"white={result['white_model']} winner={result['winner']} "
                      f"moves={result['num_moves']} game={result['duration_ms'] // 1000}s "
                      f"elapsed={int(elapsed // 60)}m eta={int(eta // 60)}m", flush=True)
    except KeyboardInterrupt:
        print(f"\n[selfplay] interrupted, progress saved ({finished}/{total}). "
              "rerun same command to resume.", flush=True)
    finally:
        con.close()
        log_file.flush()


def main():
    parser = build_parser()
    args = parser.parse_args()
    game_config = import_module(f"python.games.{args.game}.selfplay.config")
    game_module = import_module(f"python.games.{args.game}.selfplay.game")
    if args.mode not in game_config.CONFIGS:
        parser.error(f"unknown mode {args.mode!r} for game {args.game!r}")
    mode = args.mode
    mode_config = game_config.CONFIGS[mode]
    configured_models = _parse_models(mode_config["models"], args.game)
    if mode == "update-elo":
        models = list_models(args.game)
        focus_models = configured_models if mode_config["models"] is not None else None
    else:
        models = configured_models
        focus_models = None
    _validate_models(models, args.game)
    if focus_models is not None:
        _validate_models(focus_models, args.game)
    if len(models) < 2 and mode != "teacher":
        print("至少需要 2 个模型", file=sys.stderr)
        raise SystemExit(1)

    con = ensure_schema(game_config.DB)
    tasks = build_tasks(
        models,
        mode_config["games_per_pair"],
        mode_config["no_self"],
        focus_models,
    )
    for task in tasks:
        task.update(time_limit_ms=game_config.TIME_LIMIT_MS, sample_moves=game_config.SAMPLE_MOVES)
    batch_id = game_config.BATCH_ID or select_batch_id(
        con, mode, tasks, game_config.TIME_LIMIT_MS, game_config.SAMPLE_MOVES)
    pending, skipped = _pending_tasks(con, tasks, batch_id)
    pair_count = len({task["pair"] for task in tasks})
    print(f"[selfplay] batch={batch_id} models={models}")
    print(f"[selfplay] pairs={pair_count} games_per_pair={mode_config['games_per_pair']} "
          f"total={len(tasks)} skipped={skipped} pending={len(pending)} "
          f"time_limit={game_config.TIME_LIMIT_MS}ms workers={game_config.WORKERS} db={game_config.DB}")
    if not pending:
        print("[selfplay] nothing to do, all done.")
        con.close()
    else:
        _run(con, pending, batch_id, skipped, game_module.play_one, game_config.WORKERS,
             game_config.LOG_DIR, game_config.TIME_LIMIT_MS)
    print(f"[selfplay] done batch={batch_id} at {datetime.now().isoformat(timespec='seconds')}")
    con = ensure_schema(game_config.DB)
    black_advantage = recompute_elo(con)
    print(f"[elo] all history fitted; black advantage={black_advantage:+.0f}")
    print_ratings(con)
    con.close()
