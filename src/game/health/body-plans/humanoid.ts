import { BodyPartType } from '../body-part-type';
import { BodyPlan } from '../body-part-template';

export const HUMANOID_BODY_PLAN: BodyPlan = [
  { type: BodyPartType.TORSO, label: 'Torso', parent: null, maxHealth: 40, vital: false, bleedRateMultiplier: 0.15, hitChanceWeight: 35 },
  { type: BodyPartType.NECK, label: 'Neck', parent: BodyPartType.TORSO, maxHealth: 15, vital: false, bleedRateMultiplier: 1.2, hitChanceWeight: 3 },
  { type: BodyPartType.HEAD, label: 'Head', parent: BodyPartType.NECK, maxHealth: 20, vital: false, bleedRateMultiplier: 0.1, hitChanceWeight: 9 },
  { type: BodyPartType.BRAIN, label: 'Brain', parent: BodyPartType.HEAD, maxHealth: 10, vital: true, bleedRateMultiplier: 0, hitChanceWeight: 1 },
  { type: BodyPartType.LEFT_EYE, label: 'Left Eye', parent: BodyPartType.HEAD, maxHealth: 5, vital: false, bleedRateMultiplier: 0.02, hitChanceWeight: 1 },
  { type: BodyPartType.RIGHT_EYE, label: 'Right Eye', parent: BodyPartType.HEAD, maxHealth: 5, vital: false, bleedRateMultiplier: 0.02, hitChanceWeight: 1 },
  { type: BodyPartType.HEART, label: 'Heart', parent: BodyPartType.TORSO, maxHealth: 15, vital: true, bleedRateMultiplier: 0, hitChanceWeight: 1 },
  { type: BodyPartType.LEFT_ARM, label: 'Left Arm', parent: BodyPartType.TORSO, maxHealth: 20, vital: false, bleedRateMultiplier: 0.08, hitChanceWeight: 12 },
  { type: BodyPartType.RIGHT_ARM, label: 'Right Arm', parent: BodyPartType.TORSO, maxHealth: 20, vital: false, bleedRateMultiplier: 0.08, hitChanceWeight: 12 },
  { type: BodyPartType.LEFT_LEG, label: 'Left Leg', parent: BodyPartType.TORSO, maxHealth: 25, vital: false, bleedRateMultiplier: 0.08, hitChanceWeight: 13 },
  { type: BodyPartType.RIGHT_LEG, label: 'Right Leg', parent: BodyPartType.TORSO, maxHealth: 25, vital: false, bleedRateMultiplier: 0.08, hitChanceWeight: 13 },
];
