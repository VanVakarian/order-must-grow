import Phaser from 'phaser';
import {
  ATTACK_SLASH_ANGLE_RAD,
  ATTACK_SLASH_DURATION_MS,
  ATTACK_THRUST_DISTANCE_PX,
  ATTACK_THRUST_DURATION_MS,
  TILE_SIZE_PX,
  WEAPON_SPRITE_ORIGIN_X,
  WEAPON_SPRITE_ORIGIN_Y,
} from '../const';
import { pickRandomBodyPart } from '../health/body-part';
import type { HealthComponent } from '../health/health-component';
import { resolveHumanoidFacing } from '../rendering/humanoid-sprite-generator';
import { Position } from '../types';
import { resolveWeaponPoseTransform } from './weapon-pose';
import { MeleeAttackMove, WEAPON_DEFINITIONS, WeaponDefinition } from './weapon-template';
import { AttackAnimationType, WeaponType } from './weapon-type';

export interface CombatTarget {
  getPosition(): Position;
  getHealth(): HealthComponent;
}

export class CombatComponent {
  private readonly scene: Phaser.Scene;
  private weapon: WeaponDefinition | null = null;
  private weaponSprite: Phaser.GameObjects.Image | null = null;
  private cooldownRemainingMs = 0;
  private isAnimating = false;
  private currentFlipY = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  equip(weaponType: WeaponType): void {
    this.weapon = WEAPON_DEFINITIONS[weaponType];
    this.cooldownRemainingMs = 0;
    this.weaponSprite?.destroy();

    const sprite = this.scene.add.image(0, 0, this.weapon.textureKey);
    const source = sprite.texture.getSourceImage() as HTMLImageElement;
    const targetLength = TILE_SIZE_PX * this.weapon.spriteLengthScale;
    const ratio = source.width / source.height;

    sprite.setDisplaySize(targetLength, targetLength / ratio);
    sprite.setOrigin(WEAPON_SPRITE_ORIGIN_X, WEAPON_SPRITE_ORIGIN_Y);
    sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    this.weaponSprite = sprite;
  }

  getWeapon(): WeaponDefinition | null {
    return this.weapon;
  }

  update(
    deltaTime: number,
    ownerSpriteX: number,
    ownerSpriteY: number,
    facingAngle: number,
    swayOffsetX: number,
  ): void {
    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaTime);
    }

    if (!this.weaponSprite || this.isAnimating) return;

    const { pose, flipX } = resolveHumanoidFacing(facingAngle);
    const transform = resolveWeaponPoseTransform(pose, flipX);

    this.weaponSprite.setPosition(
      ownerSpriteX + transform.offsetX + swayOffsetX,
      ownerSpriteY + transform.offsetY,
    );
    this.weaponSprite.setRotation(transform.rotation);
    this.weaponSprite.setFlipY(transform.flipY);
    this.weaponSprite.setDepth(transform.depth);
    this.currentFlipY = transform.flipY;
  }

  tryAttack(attackerPosition: Position, target: CombatTarget | null): MeleeAttackMove | null {
    if (!this.weapon || this.cooldownRemainingMs > 0) return null;

    this.cooldownRemainingMs = this.weapon.attackCooldownMs;

    const move = this.weapon.attackMoves[Math.floor(Math.random() * this.weapon.attackMoves.length)];
    this.playAttackAnimation(move.animation);

    if (target && this.isInRange(attackerPosition, target)) {
      const bodyPart = pickRandomBodyPart(target.getHealth().getParts());
      target.getHealth().applyDamage(bodyPart, this.weapon.damage);
    }

    return move;
  }

  private isInRange(attackerPosition: Position, target: CombatTarget): boolean {
    if (!this.weapon || target.getHealth().isDead()) return false;

    const targetPosition = target.getPosition();
    const distance = Math.hypot(targetPosition.x - attackerPosition.x, targetPosition.y - attackerPosition.y);
    return distance <= this.weapon.attackRangeTiles;
  }

  destroy(): void {
    this.weaponSprite?.destroy();
  }

  private playAttackAnimation(animation: AttackAnimationType): void {
    if (!this.weaponSprite) return;

    this.isAnimating = true;
    const onComplete = () => {
      this.isAnimating = false;
    };

    if (animation === AttackAnimationType.THRUST) {
      const bladeAngle = this.weaponSprite.rotation;
      const originX = this.weaponSprite.x;
      const originY = this.weaponSprite.y;

      this.scene.tweens.add({
        targets: this.weaponSprite,
        x: originX + Math.cos(bladeAngle) * ATTACK_THRUST_DISTANCE_PX,
        y: originY + Math.sin(bladeAngle) * ATTACK_THRUST_DISTANCE_PX,
        duration: ATTACK_THRUST_DURATION_MS / 2,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete,
      });
      return;
    }

    const baseRotation = this.weaponSprite.rotation;
    const slashDirection = this.currentFlipY ? -1 : 1;
    this.scene.tweens.add({
      targets: this.weaponSprite,
      rotation: baseRotation + slashDirection * ATTACK_SLASH_ANGLE_RAD,
      duration: ATTACK_SLASH_DURATION_MS / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete,
    });
  }
}
