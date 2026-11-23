import { type Pos } from './geometry.js';
import { makeContext, skillAttackTargets, skillHitCells, skillMoveOptions } from './skill.js';
import { STANCES, type StanceName } from './stances.js';

export const stanceIsNoMove = (card: StanceName) => STANCES[card].move(makeContext()).length === 0;
export const stanceIsDodge = (card: StanceName) => Boolean(STANCES[card].immune);
export const stanceIsCharge = (card: StanceName) => Boolean(STANCES[card].charge);

export const stanceMoveOptions = ({ card, pos, seat }: { card: StanceName; pos: Pos; seat: number }) =>
    skillMoveOptions(STANCES[card], makeContext({ from: pos, to: pos, playerIndex: seat as 0 | 1 }));

export const stanceAttackOptions = ({ card, pos, seat, origin }: { card: StanceName; pos: Pos; seat: number; origin: Pos }) =>
    skillAttackTargets(STANCES[card], makeContext({ from: origin, to: pos, playerIndex: seat as 0 | 1 }));

export const stanceHitCells = ({ card, attackAt, pos, seat, origin }: { card: StanceName; attackAt: Pos | null; pos: Pos; seat: number; origin: Pos }) =>
    skillHitCells({ skill: STANCES[card], ctx: makeContext({ from: origin, to: pos, playerIndex: seat as 0 | 1 }), target: attackAt });
