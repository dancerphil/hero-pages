import sqlite3
import unittest

import numpy as np

from python.selfplay.elo import recompute_elo


class EloTests(unittest.TestCase):
    def setUp(self):
        self.con = sqlite3.connect(":memory:")
        self.addCleanup(self.con.close)
        self.con.execute("CREATE TABLE games (black_model TEXT, white_model TEXT, winner TEXT)")
        self.con.execute(
            "CREATE TABLE elo_ratings (model TEXT PRIMARY KEY, rating REAL, games INTEGER, "
            "wins INTEGER, losses INTEGER, draws INTEGER, updated_at TEXT)"
        )

    def add_games(self, games):
        self.con.executemany("INSERT INTO games VALUES (?, ?, ?)", games)

    def ratings(self):
        return self.con.execute(
            "SELECT model, rating, games, wins, losses, draws FROM elo_ratings ORDER BY model"
        ).fetchall()

    def test_order_independent_and_idempotent(self):
        games = [("a", "b", "black")] * 40 + [("b", "a", "white")] * 20
        games += [("a", "b", "draw")] * 5 + [("b", "a", "black")] * 10
        self.add_games(games)
        advantage = recompute_elo(self.con)
        expected = self.ratings()
        self.assertEqual(recompute_elo(self.con), advantage)
        self.assertEqual(self.ratings(), expected)
        self.con.execute("DELETE FROM games")
        self.add_games(list(reversed(games)))
        self.assertEqual(recompute_elo(self.con), advantage)
        self.assertEqual(self.ratings(), expected)
        self.assertGreater(expected[0][1], expected[1][1])
        self.assertEqual(expected[0][2:], (75, 60, 10, 5))
        self.assertEqual(expected[1][2:], (75, 10, 60, 5))

    def test_black_advantage_does_not_become_model_strength(self):
        # Unequal color counts, but the same 80% black score for both models.
        self.add_games([("a", "b", "black")] * 8000 + [("a", "b", "white")] * 2000
                       + [("b", "a", "black")] * 800 + [("b", "a", "white")] * 200)
        advantage = recompute_elo(self.con)
        self.assertAlmostEqual(advantage, 400 * np.log10(4), delta=3)
        for row in self.ratings():
            self.assertAlmostEqual(row[1], 1500, delta=2)

    def test_selfplay_only_informs_color_advantage(self):
        self.add_games([("a", "a", "black")] * 100)
        self.assertGreater(recompute_elo(self.con), 0)
        self.assertEqual(self.ratings(), [("a", 1500, 0, 0, 0, 0)])

    def test_undefeated_and_disconnected_models_are_finite(self):
        self.add_games([("a", "b", "black"), ("b", "a", "white"),
                        ("c", "d", "draw"), ("d", "c", "draw")] * 100)
        recompute_elo(self.con)
        rows = self.ratings()
        self.assertTrue(all(np.isfinite(row[1]) for row in rows))
        self.assertGreater(rows[0][1], rows[1][1])
        self.assertAlmostEqual(sum(row[1] for row in rows) / 4, 1500)
        self.assertAlmostEqual(rows[2][1], 1500)
        self.assertAlmostEqual(rows[3][1], 1500)

    def test_empty_history_clears_stale_ratings(self):
        self.add_games([("a", "b", "draw")])
        recompute_elo(self.con)
        self.con.execute("DELETE FROM games")
        self.assertEqual(recompute_elo(self.con), 0)
        self.assertEqual(self.ratings(), [])
