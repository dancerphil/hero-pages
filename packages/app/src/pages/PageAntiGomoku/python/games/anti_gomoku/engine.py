"""One JSON board request on stdin, one JSON move response on stdout."""

import json
import sys

from .mcts import search
from .rules import SIZE


def main():
    request = json.load(sys.stdin)
    move, root = search(request["board"], request["player"], request.get("time_ms", 500))
    row, col = divmod(move, SIZE)
    print(json.dumps({"row": row, "col": col, "visits": root.visits}))


if __name__ == "__main__":
    main()
