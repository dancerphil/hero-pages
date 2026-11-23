import io
import json
import random
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from python.games.anti_gomoku.engine import main
from python.games.anti_gomoku.mcts import Node, expand, search, simulate
from python.games.anti_gomoku.models.heuristic import evaluate
from python.games.anti_gomoku.rules import WINDOWS, losing_line


def dense_board():
    # No direction contains more than two consecutive stones of one colour.
    return ["black" if (r + 2 * c) % 4 < 2 else "white" for r in range(15) for c in range(15)]


def endgame():
    board = dense_board()
    board[0] = board[6] = None
    board[1:5] = ["black"] * 4
    return board


class RulesTests(unittest.TestCase):
    def test_four_directions_and_overlines_at_edges(self):
        for start, stride in ((0, 1), (0, 15), (0, 16), (14, 14)):
            for count in (4, 5, 6):
                with self.subTest(start=start, stride=stride, count=count):
                    board = [None] * 225
                    for i in range(count):
                        board[start + i * stride] = "black"
                    self.assertEqual(losing_line(board, start, "black") is not None, count >= 5)

    def test_no_row_wrapping(self):
        board = [None] * 225
        board[12:17] = ["black"] * 5
        self.assertIsNone(losing_line(board, 14, "black"))

    def test_full_board_is_draw(self):
        board = dense_board()
        self.assertTrue(all(losing_line(board, p, cell) is None for p, cell in enumerate(board)))
        self.assertEqual(evaluate(board, "black"), ({}, 0.0))


class SearchTests(unittest.TestCase):
    def test_all_empty_cells_are_candidates(self):
        scores, value = evaluate([None] * 225, "black")
        self.assertEqual(set(scores), set(range(225)))
        self.assertEqual(value, 0.0)

    def test_avoid_immediate_loss_and_leave_board_unchanged(self):
        board = [None] * 225
        board[0:4] = ["black"] * 4
        original = board.copy()
        move, root = search(board, "black", simulations=30, seed=7)
        self.assertNotEqual(move, 4)
        self.assertNotIn(4, dict(root.actions))
        self.assertEqual(board, original)
        self.assertEqual(root.visits, 30)

    def test_forced_loss_is_still_a_legal_move(self):
        board = endgame()
        board[6] = "white"
        move, root = search(board, "black", simulations=20, seed=1)
        self.assertEqual(move, 0)
        self.assertEqual(root.value, -1.0)
        self.assertTrue(root.terminal)

    def test_only_safe_move(self):
        move, _ = search(endgame(), "black", simulations=20, seed=1)
        self.assertEqual(move, 6)

    def test_search_forces_opponent_to_lose_instead_of_drawing(self):
        board = endgame()
        for window in WINDOWS:
            self.assertFalse(all(board[pos] == "black" for pos in window))
            self.assertFalse(all(board[pos] == "white" for pos in window))
        for seed in range(5):
            move, root = search(board, "white", simulations=64, seed=seed)
            self.assertEqual(move, 6)
            self.assertEqual(root.children[6].mean, -1.0)
            self.assertGreater(root.mean, 0)

    def test_last_safe_move_backs_up_as_draw(self):
        board = dense_board()
        board[0] = None
        rng = random.Random(0)
        node = Node(board, "black")
        expand(node, rng)
        simulate(node, rng)
        self.assertTrue(node.children[0].terminal)
        self.assertEqual(node.mean, 0.0)

    def test_losing_move_precedes_full_board_draw(self):
        board = endgame()
        board[0] = "black"
        board[6] = "white"
        node = Node(board, "white")
        expand(node, random.Random(0), last_move=0)
        self.assertTrue(node.terminal)
        self.assertEqual(node.value, 1.0)

    def test_value_changes_sign_with_player(self):
        board = [None] * 225
        board[:4] = ["black"] * 4
        self.assertAlmostEqual(evaluate(board, "black")[1], -evaluate(board, "white")[1])

    def test_reject_full_board(self):
        with self.assertRaisesRegex(ValueError, "full board"):
            search(dense_board(), "black")

    def test_json_request_response(self):
        request = json.dumps({"board": endgame(), "player": "black", "time_ms": 20})
        output = io.StringIO()
        with patch("sys.stdin", io.StringIO(request)), redirect_stdout(output):
            main()
        response = json.loads(output.getvalue())
        self.assertEqual((response["row"], response["col"]), (0, 6))


if __name__ == "__main__":
    unittest.main()
