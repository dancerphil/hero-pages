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

export class PuzzleBoard {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly source: HTMLCanvasElement;
    private readonly cols: number;
    private readonly rows: number;
    private readonly pieces: Piece[] = [];
    private readonly onComplete: () => void;
    private width = 0;
    private height = 0;
    private cell = 0;
    private originX = 0;
    private originY = 0;
    private grab: Grab | null = null;

    constructor(input: { canvas: HTMLCanvasElement; image: HTMLImageElement; cols: number; rows: number; onComplete: () => void }) {
        this.canvas = input.canvas;
        this.ctx = context2d(input.canvas);
        this.cols = input.cols;
        this.rows = input.rows;
        this.onComplete = input.onComplete;
        this.source = coverSource(input);
        for (let row = 0; row < input.rows; row++) {
            for (let col = 0; col < input.cols; col++) {
                this.pieces.push({ row, col, fx: Math.random(), fy: Math.random(), placed: false });
            }
        }
        this.canvas.addEventListener('pointerdown', this.handleDown);
        this.canvas.addEventListener('pointermove', this.handleMove);
        this.canvas.addEventListener('pointerup', this.handleUp);
        this.canvas.addEventListener('pointercancel', this.handleUp);
    }

    resize(width: number, height: number) {
        const ratio = window.devicePixelRatio;
        this.width = width;
        this.height = height;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.cell = Math.min(width / this.cols, height / this.rows) * BOARD_RATIO;
        this.originX = (width - this.cols * this.cell) / 2;
        this.originY = (height - this.rows * this.cell) / 2;
        this.draw();
    }

    private target(piece: Piece) {
        return { x: this.originX + piece.col * this.cell, y: this.originY + piece.row * this.cell };
    }

    private position(piece: Piece) {
        if (piece.placed) return this.target(piece);
        return { x: piece.fx * (this.width - this.cell), y: piece.fy * (this.height - this.cell) };
    }

    private pointer(event: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    private hit(piece: Piece, x: number, y: number) {
        const { x: left, y: top } = this.position(piece);
        return x >= left && x <= left + this.cell && y >= top && y <= top + this.cell;
    }

    private handleDown = (event: PointerEvent) => {
        const { x, y } = this.pointer(event);
        const piece = [...this.pieces].reverse().find(item => !item.placed && this.hit(item, x, y));
        if (!piece) return;
        this.canvas.setPointerCapture(event.pointerId);
        const { x: left, y: top } = this.position(piece);
        this.grab = { piece, dx: x - left, dy: y - top };
        this.pieces.splice(this.pieces.indexOf(piece), 1);
        this.pieces.push(piece);
        this.draw();
    };

    private handleMove = (event: PointerEvent) => {
        if (!this.grab) return;
        const { x, y } = this.pointer(event);
        const { piece, dx, dy } = this.grab;
        piece.fx = clamp((x - dx) / (this.width - this.cell));
        piece.fy = clamp((y - dy) / (this.height - this.cell));
        this.draw();
    };

    private handleUp = () => {
        if (!this.grab) return;
        const { piece } = this.grab;
        this.grab = null;
        const { x, y } = this.position(piece);
        const target = this.target(piece);
        if (Math.hypot(x - target.x, y - target.y) < this.cell * SNAP_RATIO) piece.placed = true;
        this.draw();
        if (this.pieces.every(item => item.placed)) this.onComplete();
    };

    private draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.setLineDash([6, 4]);
        this.ctx.strokeStyle = '#adb5bd';
        this.ctx.strokeRect(this.originX, this.originY, this.cols * this.cell, this.rows * this.cell);
        this.ctx.setLineDash([]);
        for (const piece of this.pieces) {
            if (piece.placed) this.drawPiece(piece);
        }
        for (const piece of this.pieces) {
            if (!piece.placed) this.drawPiece(piece);
        }
    }

    private drawPiece(piece: Piece) {
        const { x, y } = this.position(piece);
        this.ctx.drawImage(this.source, piece.col * TILE_PX, piece.row * TILE_PX, TILE_PX, TILE_PX, x, y, this.cell, this.cell);
        if (piece.placed) return;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.strokeRect(x, y, this.cell, this.cell);
    }
}
