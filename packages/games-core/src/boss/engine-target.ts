import { eqPos, type Pos } from '../geometry.js';
import { makeContext, skillAttackTargets, skillMoveOptions, type Skill } from '../skill.js';

const playerContext = ({ from, to, opponent }: { from: Pos; to: Pos; opponent: Pos }) =>
    makeContext({ from, to, playerIndex: 0, opponent });

export const resolvePlayerTarget = ({ positions, cardSkill, moveTo, attackAt }: { positions: [Pos, Pos]; cardSkill: Skill; moveTo?: Pos; attackAt?: Pos | null }) => {
    const [playerFrom, opponent] = positions;
    let playerTo = playerFrom;
    const moveOptions = skillMoveOptions(cardSkill, playerContext({ from: playerFrom, to: playerFrom, opponent }));
    if (moveOptions.length > 0) {
        if (!moveTo || !moveOptions.some(option => eqPos(option, moveTo))) {
            return null;
        }
        playerTo = moveTo;
    }

    let resolvedAttackAt: Pos | null = null;
    const attackContext = playerContext({ from: playerFrom, to: playerTo, opponent });
    const attackOptions = skillAttackTargets(cardSkill, attackContext);
    if (attackOptions.length > 0 && attackAt) {
        if (!attackOptions.some(option => eqPos(option, attackAt))) {
            return null;
        }
        resolvedAttackAt = attackAt;
    }
    return { playerTo, resolvedAttackAt, attackContext };
};
