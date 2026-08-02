import { StatModifier, StatModifierMode } from '../stats/stat-modifier';
import { StatType } from '../stats/stat-type';
import { BodyPart } from './body-part';
import { BodyPartType } from './body-part-type';

export const INJURY_MODIFIER_SOURCE = 'injury';

function pairModifier(
  statType: StatType,
  leftDestroyed: boolean,
  rightDestroyed: boolean,
  oneDestroyedMultiplier: number,
  bothDestroyedMultiplier: number,
): StatModifier | null {
  if (leftDestroyed && rightDestroyed) {
    return { sourceId: INJURY_MODIFIER_SOURCE, statType, mode: StatModifierMode.MULTIPLIER, value: bothDestroyedMultiplier };
  }
  if (leftDestroyed || rightDestroyed) {
    return { sourceId: INJURY_MODIFIER_SOURCE, statType, mode: StatModifierMode.MULTIPLIER, value: oneDestroyedMultiplier };
  }
  return null;
}

export function computeInjuryModifiers(parts: ReadonlyMap<BodyPartType, BodyPart>): StatModifier[] {
  const modifiers: StatModifier[] = [];

  const leftEye = parts.get(BodyPartType.LEFT_EYE);
  const rightEye = parts.get(BodyPartType.RIGHT_EYE);
  const sightModifier = pairModifier(
    StatType.SIGHT_RANGE,
    leftEye?.isDestroyed() ?? false,
    rightEye?.isDestroyed() ?? false,
    0.5,
    0,
  );
  if (sightModifier) modifiers.push(sightModifier);

  const leftLeg = parts.get(BodyPartType.LEFT_LEG);
  const rightLeg = parts.get(BodyPartType.RIGHT_LEG);
  const moveModifier = pairModifier(
    StatType.MOVE_SPEED,
    leftLeg?.isDestroyed() ?? false,
    rightLeg?.isDestroyed() ?? false,
    0.5,
    0.05,
  );
  if (moveModifier) modifiers.push(moveModifier);

  const leftArm = parts.get(BodyPartType.LEFT_ARM);
  const rightArm = parts.get(BodyPartType.RIGHT_ARM);
  const aimModifier = pairModifier(
    StatType.AIM_ACCURACY,
    leftArm?.isDestroyed() ?? false,
    rightArm?.isDestroyed() ?? false,
    0.6,
    0.1,
  );
  if (aimModifier) modifiers.push(aimModifier);

  return modifiers;
}
