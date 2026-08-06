import Phaser from 'phaser';
import {
  ATTACK_SLASH_ANGLE_RAD,
  ATTACK_SLASH_DURATION_MS,
  ATTACK_THRUST_DISTANCE_PX,
  ATTACK_THRUST_DURATION_MS,
  RENDER_DEPTH_WEAPON_BEHIND_OFFSET,
  RENDER_DEPTH_WEAPON_FRONT_OFFSET,
  TILE_SIZE_PX,
  WEAPON_SPRITE_ORIGIN_X,
  WEAPON_SPRITE_ORIGIN_Y,
} from '../const';
import { pickRandomBodyPart } from '../health/body-part';
import type { HealthComponent } from '../health/health-component';
import { resolveHumanoidFacing } from '../rendering/humanoid-sprite-generator';
import { Position } from '../types';
import { resolveWeaponPoseTransform, WeaponLayer } from './weapon-pose';
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
  private currentFlipY = false;
  // Смещение текущей анимации атаки поверх базовой позы (0 = поза покоя, 1 = пик выпада/взмаха).
  // Базовая поза каждый кадр пересчитывается от позиции владельца, поэтому оружие
  // никогда не "отвязывается" от персонажа, даже во время анимации.
  private animationType: AttackAnimationType | null = null;
  private animationProgress = 0;
  private slashDirection = 1;

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
    ownerDepth: number,
  ): void {
    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaTime);
    }

    if (!this.weaponSprite) return;

    const { pose, flipX } = resolveHumanoidFacing(facingAngle);
    const transform = resolveWeaponPoseTransform(pose, flipX);

    let offsetX = transform.offsetX;
    let offsetY = transform.offsetY;
    let rotation = transform.rotation;

    if (this.animationType === AttackAnimationType.THRUST) {
      offsetX += Math.cos(rotation) * ATTACK_THRUST_DISTANCE_PX * this.animationProgress;
      offsetY += Math.sin(rotation) * ATTACK_THRUST_DISTANCE_PX * this.animationProgress;
    } else if (this.animationType === AttackAnimationType.SLASH) {
      rotation += this.slashDirection * ATTACK_SLASH_ANGLE_RAD * this.animationProgress;
    }

    this.weaponSprite.setPosition(ownerSpriteX + offsetX + swayOffsetX, ownerSpriteY + offsetY);
    this.weaponSprite.setRotation(rotation);
    this.weaponSprite.setFlipY(transform.flipY);
    this.weaponSprite.setDepth(
      ownerDepth +
        (transform.layer === WeaponLayer.FRONT
          ? RENDER_DEPTH_WEAPON_FRONT_OFFSET
          : -RENDER_DEPTH_WEAPON_BEHIND_OFFSET),
    );
    this.currentFlipY = transform.flipY;
  }

  tryAttack(attackerPosition: Position, target: CombatTarget | null): MeleeAttackMove | null {
    if (!this.weapon || this.cooldownRemainingMs > 0) return null;

    this.cooldownRemainingMs = this.weapon.attackCooldownMs;

    const move =
      this.weapon.attackMoves[Math.floor(Math.random() * this.weapon.attackMoves.length)];
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
    const distance = Math.hypot(
      targetPosition.x - attackerPosition.x,
      targetPosition.y - attackerPosition.y,
    );
    return distance <= this.weapon.attackRangeTiles;
  }

  destroy(): void {
    this.weaponSprite?.destroy();
  }

  private playAttackAnimation(animation: AttackAnimationType): void {
    if (!this.weaponSprite) return;

    this.animationType = animation;
    this.animationProgress = 0;
    this.slashDirection = this.currentFlipY ? -1 : 1;

    const progress = { value: 0 };
    const duration =
      animation === AttackAnimationType.THRUST
        ? ATTACK_THRUST_DURATION_MS
        : ATTACK_SLASH_DURATION_MS;

    this.scene.tweens.add({
      targets: progress,
      value: 1,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        this.animationProgress = progress.value;
      },
      onComplete: () => {
        this.animationType = null;
        this.animationProgress = 0;
      },
    });
  }
}
