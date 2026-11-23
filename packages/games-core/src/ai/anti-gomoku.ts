import type { AntiGomokuPlayer } from '../anti-gomoku.js';
import { DIRS, SIZE, evaluate, opponent } from './anti-gomoku-evaluate.js';

export const losingLine = ({ board, pos, player }: { board: (AntiGomokuPlayer | null)[]; pos: number; player: AntiGomokuPlayer }) => {
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    for (const [dr, dc] of DIRS) {
        const line = [pos];
        for (const sign of [-1, 1]) {
            for (let step = 1; step <= 4; step++) {
                const r = row + sign * step * dr;
                const c = col + sign * step * dc;
                if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || board[r * SIZE + c] !== player) break;
                line.push(r * SIZE + c);
            }
        }
        if (line.length >= 5) return line;
    }
    return null;
};

interface Node {
    board: (AntiGomokuPlayer | null)[];
    player: AntiGomokuPlayer;
    visits: number;
    total: number;
    children: Map<number, Node>;
    actions: [number, number][];
    value: number;
    terminal: boolean;
}

const createNode = (board: (AntiGomokuPlayer | null)[], player: AntiGomokuPlayer): Node => ({
    board,
    player,
    visits: 0,
    total: 0,
    children: new Map(),
    actions: [],
    value: 0,
    terminal: false,
});

const expand = (node: Node, lastMove: number | null) => {
    if (lastMove !== null && losingLine({ board: node.board, pos: lastMove, player: opponent(node.player) })) {
        node.value = 1;
        node.terminal = true;
        return;
    }
    const { scores, value } = evaluate(node.board, node.player);
    node.value = value;
    node.terminal = scores.size === 0;
    if (node.terminal) return;
    const best = Math.max(...scores.values());
    const weights = new Map([...scores].map(([pos, score]): [number, number] => [pos, Math.exp((score - best) / 8)]));
    const total = weights.values().reduce((sum, w) => sum + w, 0);
    node.actions = [...weights.keys()]
        .toSorted((a, b) => weights.get(b) - weights.get(a) || Math.random() - 0.5)
        .map((pos): [number, number] => [pos, weights.get(pos) / total]);
};

const simulate = (root: Node) => {
    let node = root;
    const path = [node];
    while (!node.terminal) {
        const width = Math.min(node.actions.length, 1 + Math.floor(2 * Math.sqrt(node.visits + 1)));
        const scale = 1.5 * Math.sqrt(node.visits + 1);
        const ucb = ([pos, prior]: [number, number]) => {
            const child = node.children.get(pos);
            if (!child) return scale * prior;
            return -(child.total / child.visits) + scale * prior / (1 + child.visits);
        };
        const candidates = node.actions.slice(0, width);
        let best = candidates[0];
        for (const action of candidates) {
            if (ucb(action) > ucb(best)) best = action;
        }
        const [pos] = best;
        const existing = node.children.get(pos);
        if (!existing) {
            const board = [...node.board];
            board[pos] = node.player;
            const child = createNode(board, opponent(node.player));
            node.children.set(pos, child);
            expand(child, pos);
            path.push(child);
            node = child;
            break;
        }
        node = existing;
        path.push(node);
    }
    let value = node.value;
    for (const current of path.toReversed()) {
        current.visits++;
        current.total += value;
        value = -value;
    }
};

export const antiGomokuMove = (
    { board, player, timeMs = 500 }: { board: (AntiGomokuPlayer | null)[]; player: AntiGomokuPlayer; timeMs?: number },
): number => {
    const empty = board.flatMap((v, pos) => (v === null ? [pos] : []));
    const root = createNode([...board], player);
    expand(root, null);
    if (root.terminal) return empty[Math.floor(Math.random() * empty.length)];
    if (root.actions.length === 1) return root.actions[0][0];
    const deadline = performance.now() + timeMs;
    do {
        simulate(root);
    } while (performance.now() < deadline);
    let best = -1;
    let bestVisits = -1;
    for (const [pos, child] of root.children) {
        if (child.visits > bestVisits) {
            bestVisits = child.visits;
            best = pos;
        }
    }
    return best;
};
