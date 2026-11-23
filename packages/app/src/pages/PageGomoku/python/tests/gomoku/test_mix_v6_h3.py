from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import random
import tempfile
import unittest
from unittest.mock import patch

import numpy as np

from python.games.gomoku import mcts, models
from python.games.gomoku.selfplay.game import play_one
from python.games.gomoku.train import mix_v6_h3 as mix


class MixV6H3Tests(unittest.TestCase):
    def args(self, directory, *extra):
        with patch.object(mix, "CONFIRM_FROM", None):
            return mix.parse_args(["--output", str(directory), *extra])

    def result(self, task, winner="black"):
        return {"black_model": task["black_model"], "white_model": task["white_model"],
                "winner": winner, "moves": [*task["opening"], 116, 117], "num_moves": 6,
                "policies": [None] * 4 + [
                    {"t": False, "d": {116: 12}, "q": 0.2, "elapsed_ms": 5100},
                    {"t": True, "d": {117: 1}, "elapsed_ms": 10}], "duration_ms": 5200}

    def test_candidate_contract_reuses_neural_policy_and_search_parameter(self):
        calls = []

        def neural(board, player):
            calls.append("n")
            return 0.8, np.ones(225) / 225

        def heuristic(board, player):
            calls.append("h")
            return -0.4, np.zeros(225)

        with patch.dict(models._resolved, {mix.NEURAL: neural, mix.HEURISTIC: heuristic}):
            for weight, expected_calls in ((0.0, ["n"]), (0.25, ["n", "h"]), (1.0, ["n", "h"])):
                calls.clear()
                model = models.make_model(mix.candidate(weight, 1.8))
                value, policy = model([None] * 225, "black")
                self.assertAlmostEqual(value, 0.8 * (1 - weight) - 0.4 * weight)
                self.assertAlmostEqual(policy.sum(), 1)
                self.assertEqual(calls, expected_calls)
                self.assertEqual(mcts.MCTS(model).c_puct, 1.8)

    def test_default_budgets_and_temporary_opponent_color_swap(self):
        args = self.args("unused")
        used, rng = set(), random.Random(1)
        prefixes = {stage: mix.openings(n, rng, used) for stage, n in
                    (("screen", 3), ("tune", 5), ("confirm", 50))}
        screen_specs = [mix.candidate(w) for w in [0, *args.weights]]
        tune_specs = [mix.candidate(w, c) for w in [0, 0.25, 0.5] for c in args.c_puct]
        for stage, specs, count in (("screen", screen_specs, 144), ("tune", tune_specs, 360)):
            tasks = mix.make_tasks(stage, [(s, o) for s in specs for o in mix.DEVELOPMENT_PANEL],
                                   prefixes[stage], args)
            self.assertEqual(len(tasks), count)
            self.assertEqual(len({t["id"] for t in tasks}), count)
        fusion = mix.candidate(0.5, 1.8)
        for baseline, count in ((mix.candidate(), 700), (mix.candidate(0, 0.8), 800)):
            tasks = mix.make_tasks("confirm", mix.confirmation_matchups(fusion, baseline),
                                   prefixes["confirm"], args)
            self.assertEqual(len(tasks), count)
            self.assertEqual(len({t["id"] for t in tasks}), count)
            duel = [t for t in tasks if t["opponent"] == mix.name_of(baseline) and t["opening_id"] == 0]
            self.assertEqual({t["color"] for t in duel}, {"black", "white"})
            for task in duel:
                self.assertEqual(task["model_specs"][mix.name_of(baseline)], baseline)
                self.assertEqual(task["model_specs"][mix.name_of(fusion)], fusion)
                self.assertEqual(task["black_model"] == mix.name_of(fusion), task["color"] == "black")
                self.assertTrue(task["record_timing"])

    def test_historical_and_stage_openings_are_disjoint_and_config_frozen(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = self.args(tmp)
            with patch.object(mix, "fingerprint", return_value={"fixture": "hash"}):
                config = mix.make_config(args)
            old = json.loads(args.exclude_config[0].read_text())["openings"]
            historical = {mix.opening_key(m) for stage in old.values() for m in stage}
            current = [mix.opening_key(m) for stage in config["openings"].values() for m in stage]
            self.assertEqual(len(set(current)), 58)
            self.assertFalse(historical.intersection(current))
            path = Path(tmp) / "config.json"
            mix.freeze(path, config)
            mix.freeze(path, config)
            changed = {**config, "rules": {**config["rules"], "minimum_duel_score": 0.51}}
            with self.assertRaisesRegex(ValueError, "new --output"):
                mix.freeze(path, changed)

    def test_clustered_paired_delta_and_color_timing_stats(self):
        args = self.args("unused")
        fusion, baseline = mix.candidate(0.5), mix.candidate()
        prefixes = mix.openings(4, random.Random(0), set())
        tasks = mix.make_tasks("confirm", mix.confirmation_matchups(fusion, baseline), prefixes, args)
        records = {}
        for task in tasks:
            if task["opponent"] in mix.PANEL:
                # M/B 在同一开局下同赢同输；各自有波动，但配对差为零。
                wins = task["opening_id"] % 2 == 0
                winner = task["color"] if wins else ("white" if task["color"] == "black" else "black")
            else:
                winner = "black"
            records[task["id"]] = {"task": task, "result": self.result(task, winner)}
        report = mix.confirm_report(tasks, records, fusion, baseline)
        self.assertEqual(report["metrics"]["panel_delta"]["ci98_75"], [0, 0])
        self.assertEqual(report["metrics"]["vs_tuned_v6"]["ci98_75"], [0, 0])
        self.assertEqual(report["external_panel"][mix.name_of(fusion)]["ci95"], [0, 1])
        duel = [t for t in tasks if t["opponent"] == mix.name_of(baseline)]
        stats = mix.summarize(duel, records)[mix.name_of(fusion)]
        self.assertEqual(stats["by_color"]["black"]["wdl"], [4, 0, 0])
        self.assertEqual(stats["by_color"]["white"]["wdl"], [0, 0, 4])
        self.assertEqual(stats["mean_visits_per_quiet_move"], 12)
        self.assertEqual(stats["mean_move_ms"], 2555)
        with self.assertRaisesRegex(ValueError, "incomplete"):
            mix.paired_scores(tasks[:-1], records)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            mix.paired_scores([*tasks, tasks[0]], records)

    def test_gates_distinguish_fusion_benefit_from_teacher_upgrade(self):
        metrics = {key: {"estimate": 0.1, "ci98_75": [0.01, 0.2]}
                   for key in ("vs_tuned_v6", "vs_old_mix", "vs_h3", "panel_delta")}
        fusion, baseline = mix.candidate(0.5), mix.candidate()
        result = mix.decide({"metrics": metrics}, fusion, baseline)
        self.assertTrue(result["teacher_upgrade_supported"])
        metrics["vs_old_mix"] = {"estimate": 0.02, "ci98_75": [-0.1, 0.14]}
        result = mix.decide({"metrics": metrics}, fusion, baseline)
        self.assertTrue(result["fusion_improved"])
        self.assertFalse(result["teacher_upgrade_supported"])
        self.assertEqual(result["recommended_teacher"], mix.OLD_MIX)
        metrics["panel_delta"] = {"estimate": 0.01, "ci98_75": [-0.03, 0.05]}
        self.assertFalse(mix.decide({"metrics": metrics}, fusion, baseline)["fusion_improved"])
        metrics["panel_delta"] = {"estimate": 0.01, "ci98_75": [-0.02, 0.05]}
        metrics["vs_tuned_v6"] = {"estimate": 0.04, "ci98_75": [0.01, 0.07]}
        self.assertFalse(mix.decide({"metrics": metrics}, fusion, baseline)["fusion_improved"])

    def test_search_writes_frozen_selection_export_and_resumes_without_games(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = self.args(tmp, "--weights", "0.25", "0.5", "--c-puct", "0.8", "1.2",
                             "--screen-pairs", "1", "--tune-pairs", "1", "--confirm-pairs", "2")

            def game(task):
                spec = task["model_specs"][task["candidate"]]
                color = task["color"]
                winner = ("white" if color == "black" else "black") if mix.weight_of(spec) == 0.25 else color
                return self.result(task, winner)

            with patch.object(mix, "fingerprint", return_value={"fixture": "hash"}), \
                    patch.object(mix, "ProcessPoolExecutor", side_effect=lambda **kw: ThreadPoolExecutor(1)), \
                    patch.object(mix, "play_one", side_effect=game) as play, patch("builtins.print"):
                mix.search(args)
                self.assertEqual(play.call_count, 24 + 48 + 28)
                selection = json.loads((Path(tmp) / "selection.json").read_text())
                self.assertEqual(selection["candidate"], mix.candidate(0.5))
                self.assertEqual(selection["baseline"], mix.candidate())
                teacher = json.loads((Path(tmp) / "teacher-manifest.json").read_text())
                self.assertEqual(teacher, {"mix-v6-h3": mix.candidate(0.5)})
                play.reset_mock()
                with patch.object(mix, "ProcessPoolExecutor") as pool:
                    mix.search(args)
                    pool.assert_not_called()
                play.assert_not_called()
                # A separate confirmation run keeps selection/openings, not old games.
                output = Path(tmp) / "confirm-8"
                output.mkdir()
                restart = self.args(output, "--confirm-from", tmp)
                self.assertEqual(restart.workers, 8)
                original_journal = (Path(tmp) / "games.jsonl").read_bytes()
                mix.search(restart)
                self.assertEqual(play.call_count, 28)
                rows = mix.read_journal(output / "games.jsonl")
                self.assertEqual({row["task"]["stage"] for row in rows.values()}, {"confirm"})
                self.assertEqual(json.loads((output / "selection.json").read_text()), selection)
                config = json.loads((output / "config.json").read_text())
                self.assertEqual(config["args"]["workers"], 8)
                self.assertEqual(config["args"]["confirm_pairs"], 2)
                self.assertEqual((Path(tmp) / "games.jsonl").read_bytes(), original_journal)
                play.reset_mock()
                mix.search(restart)
                play.assert_not_called()
                with patch.object(mix, "fingerprint", return_value={"fixture": "changed"}):
                    with self.assertRaisesRegex(ValueError, "fingerprint changed"):
                        mix.search(restart)
                with self.assertRaisesRegex(ValueError, "separate --output"):
                    mix.search(self.args(tmp, "--confirm-from", tmp))

    def test_partial_resume_and_uncommitted_tail(self):
        with tempfile.TemporaryDirectory() as tmp, patch("builtins.print"):
            args = self.args(tmp)
            tasks = mix.make_tasks("screen", [(mix.candidate(), mix.OLD_MIX)], [[112, 113, 97, 98]], args)
            path = Path(tmp) / "games.jsonl"
            row = {"task": tasks[0], "result": self.result(tasks[0])}
            committed = json.dumps(row) + "\n"
            path.write_text(committed + '{"task":')
            records = mix.read_journal(path)
            self.assertEqual(path.read_text(), committed)
            with patch.object(mix, "ProcessPoolExecutor", side_effect=lambda **kw: ThreadPoolExecutor(1)), \
                    patch.object(mix, "play_one", side_effect=self.result) as play:
                mix.run_tasks("screen", tasks, args, records)
                play.assert_called_once_with(tasks[1])
            self.assertEqual(len(mix.read_journal(path)), 2)
            changed = [{**tasks[0], "time_limit_ms": 1}]
            with self.assertRaisesRegex(ValueError, "saved task changed"):
                mix.run_tasks("screen", changed, args, records)
            path.write_text(committed + committed)
            with self.assertRaisesRegex(ValueError, "duplicate result"):
                mix.read_journal(path)
            path.write_text(committed + "broken\n")
            with self.assertRaises(json.JSONDecodeError):
                mix.read_journal(path)

    def test_play_one_records_search_timing_only_when_requested(self):
        model = lambda board, player: (0, np.ones(225) / 225)
        task = {"black_model": "fixture", "white_model": "fixture", "time_limit_ms": 5000,
                "opening": [112, 113, 97, 98], "record_timing": True}
        with patch.dict(models.REGISTRY, {"fixture": model}), \
                patch.object(mcts, "get_best_move_with_stats", return_value=(116, {116: 12}, False, 0.2)), \
                patch.object(mcts, "check_win_at", side_effect=lambda b, p, c: p == 116), \
                patch("python.games.gomoku.selfplay.game.time.monotonic", side_effect=[0, 1, 6.1, 6.2]):
            result = play_one(task)
        self.assertAlmostEqual(result["policies"][4]["elapsed_ms"], 5100)
        self.assertEqual(result["policies"][:4], [None] * 4)
        self.assertEqual(result["policies"][4]["q"], 0.2)


if __name__ == "__main__":
    unittest.main()
