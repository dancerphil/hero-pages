"""Small PUCT search with heuristic leaves and progressive widening."""

import math
import random
import time
from dataclasses import dataclass, field

from .models.heuristic import evaluate
from .rules import losing_line, opponent


@dataclass
class Node:
    board: list
    player: str
    visits: int = 0
    total: float = 0.0
    children: dict = field(default_factory=dict)
    actions: list = field(default_factory=list)
    value: float = 0.0
    terminal: bool = False

    @property
    def mean(self):
        return self.total / self.visits if self.visits else 0.0


def expand(node, rng, last_move=None):
    if last_move is not None and losing_line(node.board, last_move, opponent(node.player)):
        node.value = 1.0  # The previous mover lost; the current player won.
        node.terminal = True
        return
    scores, node.value = evaluate(node.board, node.player)
    node.terminal = not scores
    if node.terminal:
        return
    best = max(scores.values())
    weights = {pos: math.exp((score - best) / 8.0) for pos, score in scores.items()}
    total = sum(weights.values())
    actions = list(weights)
    rng.shuffle(actions)
    actions.sort(key=weights.get, reverse=True)
    node.actions = [(pos, weights[pos] / total) for pos in actions]


def simulate(root, rng):
    node = root
    path = [node]
    while not node.terminal:
        # All safe cells remain eligible, including isolated and edge cells.
        width = min(len(node.actions), 1 + int(2 * math.sqrt(node.visits + 1)))
        scale = 1.5 * math.sqrt(node.visits + 1)

        def ucb(action):
            pos, prior = action
            child = node.children.get(pos)
            if child is None:
                return scale * prior
            return -child.mean + scale * prior / (1 + child.visits)

        pos, _ = max(node.actions[:width], key=ucb)
        child = node.children.get(pos)
        if child is None:
            board = node.board.copy()
            board[pos] = node.player
            child = Node(board, opponent(node.player))
            node.children[pos] = child
            expand(child, rng, last_move=pos)
            path.append(child)
            node = child
            break
        node = child
        path.append(node)
    value = node.value
    for current in reversed(path):
        current.visits += 1
        current.total += value
        value = -value


def search(board, player, time_ms=500, *, simulations=None, seed=None):
    """Return (move, root). A fixed simulation budget is useful for tests."""
    if len(board) != 225 or player not in ("black", "white") or any(
        cell not in (None, "black", "white") for cell in board
    ):
        raise ValueError("expected a 15×15 board and a black/white player")
    if time_ms <= 0 or (simulations is not None and simulations <= 0):
        raise ValueError("search budget must be positive")
    empty = [pos for pos, cell in enumerate(board) if cell is None]
    if not empty:
        raise ValueError("cannot move on a full board")
    deadline = time.perf_counter() + time_ms / 1000
    rng = random.Random(seed)
    root = Node(board.copy(), player)
    expand(root, rng)
    if root.terminal:
        # All empty cells lose, but self-defeating moves are still legal.
        return rng.choice(empty), root
    if len(root.actions) == 1:
        return root.actions[0][0], root
    while (
        root.visits < simulations if simulations is not None
        else root.visits == 0 or time.perf_counter() < deadline
    ):
        simulate(root, rng)
    move = max(root.children, key=lambda pos: root.children[pos].visits)
    return move, root
