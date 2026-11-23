import { checkWinAny, getCandidates, other } from './gomoku-board.js';
import { findTacticalMove } from './gomoku-tactics.js';

export type GomokuPlayer = 'black' | 'white';
export type GomokuBoard = (GomokuPlayer | null)[];
export type GomokuEvaluate = (board: GomokuBoard, player: GomokuPlayer) => Promise<{ value: number; policy: number[] }>;

interface Node {
    board: GomokuBoard;
    player: GomokuPlayer;
    prior: number;
    children: Map<number, Node>;
    visitCount: number;
    valueSum: number;
    value: number;
    expanded: boolean;
}

const createNode = ({ board, player, prior = 0 }: { board: GomokuBoard; player: GomokuPlayer; prior?: number }): Node => ({
    board,
    player,
    prior,
    children: new Map(),
    visitCount: 0,
    valueSum: 0,
    value: 0,
    expanded: false,
});

const isTerminal = (board: GomokuBoard) => checkWinAny(board) !== null || board.every(v => v !== null);

const terminalValue = (board: GomokuBoard, player: GomokuPlayer) => {
    const winner = checkWinAny(board);
    if (winner === null) return 0;
    return winner === player ? 1 : -1;
};

const childOf = ({ node, pos, prior }: { node: Node; pos: number; prior: number }) => {
    const board = [...node.board];
    board[pos] = node.player;
    return [pos, createNode({ board, player: other(node.player), prior })] as const;
};

const expand = async (node: Node, evaluate: GomokuEvaluate) => {
    const { value, policy } = await evaluate(node.board, node.player);
    node.value = value;
    node.expanded = true;
    const tactical = findTacticalMove(node.board, node.player);
    if (tactical !== null) {
        node.children = new Map([childOf({ node, pos: tactical, prior: 1 })]);
        return value;
    }
    const cands = getCandidates(node.board);
    const total = cands.reduce((sum, p) => sum + policy[p], 0);
    if (total < 1e-8) {
        node.children = new Map(cands.map(p => childOf({ node, pos: p, prior: 1 / cands.length })));
    }
    else {
        node.children = new Map(cands
            .filter(p => policy[p] / total >= 1e-6)
            .map(p => childOf({ node, pos: p, prior: policy[p] / total })));
    }
    return value;
};

const selectChild = (node: Node, cPuct: number) => {
    const totalVisits = node.children.values().reduce((sum, c) => sum + c.visitCount, 0);
    let best: Node | null = null;
    let bestScore = -Infinity;
    for (const child of node.children.values()) {
        const q = child.visitCount ? -child.valueSum / child.visitCount : 0;
        const u = cPuct * child.prior * Math.sqrt(totalVisits + 1) / (child.visitCount + 1);
        if (q + u > bestScore) {
            bestScore = q + u;
            best = child;
        }
    }
    return best;
};

export const gomokuMove = async ({ board, player, evaluate, timeMs = 2000, cPuct = 1.2 }: { board: GomokuBoard; player: GomokuPlayer; evaluate: GomokuEvaluate; timeMs?: number; cPuct?: number }): Promise<number> => {
    const tactical = findTacticalMove(board, player);
    if (tactical !== null) return tactical;
    const root = createNode({ board: [...board], player });
    await expand(root, evaluate);
    if (root.children.size === 0) return getCandidates(board)[0];
    const deadline = performance.now() + timeMs;
    while (performance.now() < deadline) {
        let node = root;
        const path = [root];
        while (node.expanded && node.children.size && !isTerminal(node.board)) {
            node = selectChild(node, cPuct);
            path.push(node);
        }
        let leaf: number;
        if (isTerminal(node.board)) leaf = terminalValue(node.board, node.player);
        else if (!node.expanded) leaf = await expand(node, evaluate);
        else leaf = node.value;
        for (const n of path.toReversed()) {
            n.visitCount++;
            n.valueSum += leaf;
            leaf = -leaf;
        }
    }
    let best = -1;
    let bestVisits = -1;
    for (const [pos, child] of root.children) {
        if (child.visitCount > bestVisits) {
            bestVisits = child.visitCount;
            best = pos;
        }
    }
    return best;
};
