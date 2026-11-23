import { STANCES, eqPos, hasNoMove, makeContext, skillAttackTargets, skillHitCells, skillMoveOptions } from './index';
import type { Pos, StanceName } from './index';

export const p = (row: number, col: number): Pos => ({ row, col });
export const has = (arr: Pos[], pos: Pos) => arr.some(q => eqPos(q, pos));

// Adapters from the legacy stance API onto the composable Skill model, so the
// behavioral assertions below double as a spec the refactor must preserve.
export const getMoveOptions = ({ name, pos, pi }: { name: StanceName; pos: Pos; pi: number }): Pos[] =>
    skillMoveOptions(STANCES[name], makeContext({ from: pos, to: pos, playerIndex: pi as 0 | 1 }));
export const getAttackOptions = ({ name, pos, pi, originalPos }: { name: StanceName; pos: Pos; pi: number; originalPos?: Pos }): Pos[] =>
    skillAttackTargets(STANCES[name], makeContext({ from: originalPos ?? pos, to: pos, playerIndex: pi as 0 | 1 }));
export const getHitCells = ({ name, attackAt, pos, pi, originalPos }: { name: StanceName; attackAt: Pos | null; pos: Pos; pi: number; originalPos?: Pos }): Pos[] =>
    skillHitCells({ skill: STANCES[name], ctx: makeContext({ from: originalPos ?? pos, to: pos, playerIndex: pi as 0 | 1 }), target: attackAt });
export const isNoMove = (name: StanceName): boolean => hasNoMove(STANCES[name], makeContext({ from: p(3, 3), to: p(3, 3) }));
export const isDodge = (name: StanceName): boolean => Boolean(STANCES[name].immune);
export const isCharge = (name: StanceName): boolean => Boolean(STANCES[name].charge);
