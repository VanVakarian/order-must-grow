import Phaser from 'phaser';
import { WeaponType } from '../combat/weapon-type';
import { ENEMY_TINT_COLOR, RENDER_DEPTH_ENTITY_SPRITE, TILE_SIZE_PX } from '../const';
import { HUMANOID_BODY_PLAN } from '../health/body-plans/humanoid';
import { HumanoidBodyType, HumanoidPose, humanoidTextureKey } from '../rendering/humanoid-sprite-generator';
import { EntityType } from '../types';
import { Character } from './character';

export class Enemy extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, EntityType.ENEMY, x, y, {}, HUMANOID_BODY_PLAN);
    this.equipWeapon(WeaponType.KNIFE);
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = TILE_SIZE_PX;
    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      humanoidTextureKey(HumanoidBodyType.MALE, HumanoidPose.FRONT),
    );
    sprite.setDepth(RENDER_DEPTH_ENTITY_SPRITE);
    sprite.setTint(ENEMY_TINT_COLOR);
    return sprite;
  }

  update(deltaTime: number): void {
    this.tickHealth(deltaTime);
    this.tickCombat(deltaTime);
    this.updateHighlightFrame();
  }
}
