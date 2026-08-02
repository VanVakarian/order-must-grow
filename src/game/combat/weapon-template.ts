import {
  KNIFE_ATTACK_COOLDOWN_MS,
  KNIFE_ATTACK_RANGE_TILES,
  KNIFE_DAMAGE,
  KNIFE_SPRITE_LENGTH_SCALE,
} from '../const';
import { AttackAnimationType, WeaponCategory, WeaponDamageType, WeaponType } from './weapon-type';

export interface MeleeAttackMove {
  damageType: WeaponDamageType;
  animation: AttackAnimationType;
}

export interface MeleeWeaponDefinition {
  category: WeaponCategory.MELEE;
  type: WeaponType;
  label: string;
  textureKey: string;
  spriteLengthScale: number;
  damage: number;
  attackRangeTiles: number;
  attackCooldownMs: number;
  attackMoves: MeleeAttackMove[];
}

export type WeaponDefinition = MeleeWeaponDefinition;

export const WEAPON_DEFINITIONS: Record<WeaponType, WeaponDefinition> = {
  [WeaponType.KNIFE]: {
    category: WeaponCategory.MELEE,
    type: WeaponType.KNIFE,
    label: 'Knife',
    textureKey: 'knife',
    spriteLengthScale: KNIFE_SPRITE_LENGTH_SCALE,
    damage: KNIFE_DAMAGE,
    attackRangeTiles: KNIFE_ATTACK_RANGE_TILES,
    attackCooldownMs: KNIFE_ATTACK_COOLDOWN_MS,
    attackMoves: [
      { damageType: WeaponDamageType.PIERCING, animation: AttackAnimationType.THRUST },
      { damageType: WeaponDamageType.SLASHING, animation: AttackAnimationType.SLASH },
    ],
  },
};
