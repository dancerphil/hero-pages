import type { GomokuBoard } from '@hero-pages/games-core/ai/gomoku';

interface BoardLineProps {
    board: GomokuBoard;
    lastMove: number | null;
    disabled: boolean;
    onPlace: (pos: number) => void;
}

export function BoardLine({ board, lastMove, disabled, onPlace }: BoardLineProps) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', width: 480, maxWidth: '90vw', background: '#dcb35c' }}>
            {board.map((cell, pos) => (
                <button
                    key={pos}
                    type="button"
                    disabled={disabled || cell !== null}
                    onClick={() => onPlace(pos)}
                    style={{ aspectRatio: '1', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                >
                    {cell && (
                        <span style={{
                            display: 'block',
                            width: '70%',
                            height: '70%',
                            margin: 'auto',
                            borderRadius: '50%',
                            background: cell,
                            outline: pos === lastMove ? '2px solid #ef4444' : undefined,
                        }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
