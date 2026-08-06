import {
  HUMANOID_HEIGHT_SCALE,
  WEAPON_HAND_OFFSET_X_PX,
  WEAPON_HAND_OFFSET_Y_PX,
  WEAPON_PROFILE_OFFSET_X_PX,
  WEAPON_SIDE_HAND_OFFSET_Y_PX,
} from '../const';
import { HumanoidPose } from '../rendering/humanoid-sprite-generator';

// Точки крепления заданы в масштабе исходной текстуры тела, поэтому растягиваются
// вместе со спрайтом персонажа — иначе рука "отстаёт" от выросшего тела.
const HAND_OFFSET_X = WEAPON_HAND_OFFSET_X_PX * HUMANOID_HEIGHT_SCALE;
const HAND_OFFSET_Y = WEAPON_HAND_OFFSET_Y_PX * HUMANOID_HEIGHT_SCALE;
const SIDE_HAND_OFFSET_Y = WEAPON_SIDE_HAND_OFFSET_Y_PX * HUMANOID_HEIGHT_SCALE;
const PROFILE_OFFSET_X = WEAPON_PROFILE_OFFSET_X_PX * HUMANOID_HEIGHT_SCALE;

// Слой оружия относительно СВОЕГО владельца (не глобальный) — итоговый depth
// считает CombatComponent как ownerDepth ± offset, чтобы оружие всегда
// сортировалось вместе со своим телом в общем Y-sort.
export enum WeaponLayer {
  FRONT = 'front',
  BEHIND = 'behind',
}

export interface WeaponPoseTransform {
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipY: boolean;
  layer: WeaponLayer;
}

// Базовая ориентация текстуры оружия: остриё смотрит вправо (rotation=0).
// flipY зеркалит клинок по длинной оси — на какую сторону смотрит лезвие после поворота.

// Позиция 1 из game.design-doc.md: лицом к нам, оружие слева, остриём вниз, поверх тела.
const FRONT: WeaponPoseTransform = {
  offsetX: -HAND_OFFSET_X,
  offsetY: HAND_OFFSET_Y,
  rotation: Math.PI / 2,
  flipY: true,
  layer: WeaponLayer.FRONT,
};

// Позиция 3: спиной к нам, оружие справа, остриём вверх, за телом.
const BACK: WeaponPoseTransform = {
  offsetX: HAND_OFFSET_X,
  offsetY: HAND_OFFSET_Y,
  rotation: -Math.PI / 2,
  flipY: true,
  layer: WeaponLayer.BEHIND,
};

// Позиция 2: правым боком (facingAngle ~0°), оружие перед корпусом, поверх тела.
const SIDE_NEAR: WeaponPoseTransform = {
  offsetX: PROFILE_OFFSET_X,
  offsetY: SIDE_HAND_OFFSET_Y,
  rotation: 0,
  flipY: false,
  layer: WeaponLayer.FRONT,
};

// Позиция 4: левым боком (facingAngle ~180°), оружие позади корпуса, за телом.
const SIDE_FAR: WeaponPoseTransform = {
  offsetX: -PROFILE_OFFSET_X,
  offsetY: SIDE_HAND_OFFSET_Y,
  rotation: Math.PI,
  flipY: true,
  layer: WeaponLayer.BEHIND,
};

export function resolveWeaponPoseTransform(
  pose: HumanoidPose,
  flipX: boolean,
): WeaponPoseTransform {
  switch (pose) {
    case HumanoidPose.FRONT:
      return FRONT;
    case HumanoidPose.BACK:
      return BACK;
    case HumanoidPose.SIDE:
      return flipX ? SIDE_FAR : SIDE_NEAR;
  }
}
