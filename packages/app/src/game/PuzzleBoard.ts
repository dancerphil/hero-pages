const TILE_PX = 256;
const BOARD_RATIO = 0.6;
const SNAP_RATIO = 0.5;

interface Piece {
    row: number;
    col: number;
    fx: number;
    fy: number;
    placed: boolean;
}

interface Grab {
    piece: Piece;
    dx: number;
    dy: number;
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

function context2d(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D 不可用');
    return ctx;
}

function coverSource(input: { image: HTMLImageElement; cols: number; rows: number }) {
    const canvas = document.createElement('canvas');
    canvas.width = input.cols * TILE_PX;
    canvas.height = input.rows * TILE_PX;
    const scale = Math.max(canvas.width / input.image.naturalWidth, canvas.height / input.image.naturalHeight);
    const width = input.image.naturalWidth * scale;
    const height = input.image.naturalHeight * scale;
    context2d(canvas).drawImage(input.image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return canvas;
}

export function createPuzzleBoard(input: { canvas: HTMLCanvasElement; image: HTMLImageElement; cols: number; rows: number; onComplete: () => void }) {
    const { canvas, cols, rows, onComplete } = input;
    const ctx = context2d(canvas);
    const source = coverSource(input);
    const pieces: Piece[] = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            pieces.push({ row, col, fx: Math.random(), fy: Math.random(), placed: false });
        }
    }
    let boardWidth = 0;
    let boardHeight = 0;
    let cell = 0;
    let originX = 0;
    let originY = 0;
    let grab: Grab | null = null;

    const target = (piece: Piece) => ({ x: originX + piece.col * cell, y: originY + piece.row * cell });

    const position = (piece: Piece) => {
        if (piece.placed) return target(piece);
        return { x: piece.fx * (boardWidth - cell), y: piece.fy * (boardHeight - cell) };
    };

    const pointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const hit = ({ piece, x, y }: { piece: Piece; x: number; y: number }) => {
        const { x: left, y: top } = position(piece);
        return x >= left && x <= left + cell && y >= top && y <= top + cell;
    };

    const drawPiece = (piece: Piece) => {
        const { x, y } = position(piece);
        ctx.drawImage(source, piece.col * TILE_PX, piece.row * TILE_PX, TILE_PX, TILE_PX, x, y, cell, cell);
        if (piece.placed) return;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeRect(x, y, cell, cell);
    };

    const draw = () => {
        ctx.clearRect(0, 0, boardWidth, boardHeight);
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#adb5bd';
        ctx.strokeRect(originX, originY, cols * cell, rows * cell);
        ctx.setLineDash([]);
        for (const piece of pieces) {
            if (piece.placed) drawPiece(piece);
        }
        for (const piece of pieces) {
            if (!piece.placed) drawPiece(piece);
        }
    };

    const handleDown = (event: PointerEvent) => {
        const { x, y } = pointer(event);
        const piece = pieces.findLast(item => !item.placed && hit({ piece: item, x, y }));
        if (!piece) return;
        canvas.setPointerCapture(event.pointerId);
        const { x: left, y: top } = position(piece);
        grab = { piece, dx: x - left, dy: y - top };
        pieces.splice(pieces.indexOf(piece), 1);
        pieces.push(piece);
        draw();
    };

    const handleMove = (event: PointerEvent) => {
        if (!grab) return;
        const { x, y } = pointer(event);
        const { piece, dx, dy } = grab;
        piece.fx = clamp((x - dx) / (boardWidth - cell));
        piece.fy = clamp((y - dy) / (boardHeight - cell));
        draw();
    };

    const handleUp = () => {
        if (!grab) return;
        const { piece } = grab;
        grab = null;
        const { x, y } = position(piece);
        const targetPoint = target(piece);
        if (Math.hypot(x - targetPoint.x, y - targetPoint.y) < cell * SNAP_RATIO) piece.placed = true;
        draw();
        if (pieces.every(item => item.placed)) onComplete();
    };

    const resize = (width: number, height: number) => {
        const ratio = window.devicePixelRatio;
        boardWidth = width;
        boardHeight = height;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        cell = Math.min(width / cols, height / rows) * BOARD_RATIO;
        originX = (width - cols * cell) / 2;
        originY = (height - rows * cell) / 2;
        draw();
    };

    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointercancel', handleUp);

    return { resize };
}
