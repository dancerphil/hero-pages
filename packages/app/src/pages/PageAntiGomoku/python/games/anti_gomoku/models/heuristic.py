"""Policy and value from safe space and unblocked five-cell windows."""

import math

from ..rules import WINDOWS, opponent

RISK = (0, 0, 1, 6, 36, 0)


def evaluate(board, player):
    """Return (safe-move scores, value), both from the player-to-move's view.

    A move can destroy an opponent's dangerous window, helping them. The
    policy therefore charges for that as well as for increasing our own risk.
    """
    other = opponent(player)
    empty = [pos for pos, cell in enumerate(board) if cell is None]
    if not empty:
        return {}, 0.0
    unsafe = {player: set(), other: set()}
    risk = {player: 0, other: 0}
    costs = dict.fromkeys(empty, 0.0)
    for window in WINDOWS:
        own = sum(board[pos] == player for pos in window)
        opp = sum(board[pos] == other for pos in window)
        if own and opp:
            continue
        holes = [pos for pos in window if board[pos] is None]
        if own:
            risk[player] += RISK[own]
            if own == 4:
                unsafe[player].update(holes)
            for pos in holes:
                costs[pos] += RISK[own + 1] - RISK[own]
        elif opp:
            risk[other] += RISK[opp]
            if opp == 4:
                unsafe[other].update(holes)
            for pos in holes:
                costs[pos] += RISK[opp]

    scores = {pos: -cost for pos, cost in costs.items() if pos not in unsafe[player]}
    if not scores:
        return {}, -1.0
    safe_difference = len(unsafe[other]) - len(unsafe[player])
    value = math.tanh(0.18 * safe_difference + 0.004 * (risk[other] - risk[player]))
    return scores, value
