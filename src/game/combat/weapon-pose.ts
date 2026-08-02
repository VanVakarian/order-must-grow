import {
  RENDER_DEPTH_WEAPON_BEHIND,
  RENDER_DEPTH_WEAPON_FRONT,
  WEAPON_HAND_OFFSET_X_PX,
  WEAPON_HAND_OFFSET_Y_PX,
  WEAPON_PROFILE_OFFSET_X_PX,
} from '../const';
import { HumanoidPose } from '../rendering/humanoid-sprite-generator';

export interface WeaponPoseTransform {
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipY: boolean;
  depth: number;
}

// Базовая ориентация текстуры оружия: остриё смотрит вправо (rotation=0).
// flipY зеркалит клинок по длинной оси — на какую сторону смотрит лезвие после поворота.

// Позиция 1 из game.design-doc.md: лицом к нам, оружие слева, остриём вниз, поверх тела.
const FRONT: WeaponPoseTransform = {
  offsetX: -WEAPON_HAND_OFFSET_X_PX,
  offsetY: WEAPON_HAND_OFFSET_Y_PX,
  rotation: Math.PI / 2,
  flipY: true,
  depth: RENDER_DEPTH_WEAPON_FRONT,
};

// Позиция 3: спиной к нам, оружие справа, остриём вверх, за телом.
const BACK: WeaponPoseTransform = {
  offsetX: WEAPON_HAND_OFFSET_X_PX,
  offsetY: WEAPON_HAND_OFFSET_Y_PX,
  rotation: -Math.PI / 2,
  flipY: true,
  depth: RENDER_DEPTH_WEAPON_BEHIND,
};

// Позиция 2: правым боком (facingAngle ~0°), оружие перед корпусом, поверх тела.
const SIDE_NEAR: WeaponPoseTransform = {
  offsetX: WEAPON_PROFILE_OFFSET_X_PX,
  offsetY: WEAPON_HAND_OFFSET_Y_PX,
  rotation: 0,
  flipY: false,
  depth: RENDER_DEPTH_WEAPON_FRONT,
};

// Позиция 4: левым боком (facingAngle ~180°), оружие позади корпуса, за телом.
const SIDE_FAR: WeaponPoseTransform = {
  offsetX: -WEAPON_PROFILE_OFFSET_X_PX,
  offsetY: WEAPON_HAND_OFFSET_Y_PX,
  rotation: Math.PI,
  flipY: true,
  depth: RENDER_DEPTH_WEAPON_BEHIND,
};

export function resolveWeaponPoseTransform(pose: HumanoidPose, flipX: boolean): WeaponPoseTransform {
  switch (pose) {
    case HumanoidPose.FRONT:
      return FRONT;
    case HumanoidPose.BACK:
      return BACK;
    case HumanoidPose.SIDE:
      return flipX ? SIDE_FAR : SIDE_NEAR;
  }
}
