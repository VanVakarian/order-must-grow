import {
  INJURY_AIM_ACCURACY_LOSS_BOTH_ARMS_MULTIPLIER,
  INJURY_AIM_ACCURACY_LOSS_ONE_ARM_MULTIPLIER,
  INJURY_MOVE_SPEED_LOSS_BOTH_LEGS_MULTIPLIER,
  INJURY_MOVE_SPEED_LOSS_ONE_LEG_MULTIPLIER,
  INJURY_SIGHT_LOSS_BOTH_EYES_MULTIPLIER,
  INJURY_SIGHT_LOSS_ONE_EYE_MULTIPLIER,
} from '../const';
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
    INJURY_SIGHT_LOSS_ONE_EYE_MULTIPLIER,
    INJURY_SIGHT_LOSS_BOTH_EYES_MULTIPLIER,
  );
  if (sightModifier) modifiers.push(sightModifier);

  const leftLeg = parts.get(BodyPartType.LEFT_LEG);
  const rightLeg = parts.get(BodyPartType.RIGHT_LEG);
  const moveModifier = pairModifier(
    StatType.MOVE_SPEED,
    leftLeg?.isDestroyed() ?? false,
    rightLeg?.isDestroyed() ?? false,
    INJURY_MOVE_SPEED_LOSS_ONE_LEG_MULTIPLIER,
    INJURY_MOVE_SPEED_LOSS_BOTH_LEGS_MULTIPLIER,
  );
  if (moveModifier) modifiers.push(moveModifier);

  const leftArm = parts.get(BodyPartType.LEFT_ARM);
  const rightArm = parts.get(BodyPartType.RIGHT_ARM);
  const aimModifier = pairModifier(
    StatType.AIM_ACCURACY,
    leftArm?.isDestroyed() ?? false,
    rightArm?.isDestroyed() ?? false,
    INJURY_AIM_ACCURACY_LOSS_ONE_ARM_MULTIPLIER,
    INJURY_AIM_ACCURACY_LOSS_BOTH_ARMS_MULTIPLIER,
  );
  if (aimModifier) modifiers.push(aimModifier);

  return modifiers;
}
