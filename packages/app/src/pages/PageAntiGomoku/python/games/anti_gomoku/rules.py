"""15×15 misère gomoku: making five (or more) loses immediately."""

SIZE = 15
DIRECTIONS = ((0, 1), (1, 0), (1, 1), (1, -1))
WINDOWS = tuple(
    tuple((row + step * dr) * SIZE + col + step * dc for step in range(5))
    for row in range(SIZE)
    for col in range(SIZE)
    for dr, dc in DIRECTIONS
    if 0 <= row + 4 * dr < SIZE and 0 <= col + 4 * dc < SIZE
)


def opponent(player):
    return "white" if player == "black" else "black"


def losing_line(board, pos, player):
    row, col = divmod(pos, SIZE)
    for dr, dc in DIRECTIONS:
        line = [pos]
        for sign in (-1, 1):
            for step in range(1, 5):
                r, c = row + sign * step * dr, col + sign * step * dc
                if not (0 <= r < SIZE and 0 <= c < SIZE):
                    break
                p = r * SIZE + c
                if board[p] != player:
                    break
                line.append(p)
        if len(line) >= 5:
            return line
    return None
