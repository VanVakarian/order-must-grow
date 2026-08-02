import Phaser from 'phaser';
import {
  HUMANOID_MAX_LEAN_ANGLE,
  PLAYER_AIM_ACCURACY,
  PLAYER_MOVE_SPEED,
  PLAYER_MOVE_SPEED_DIRECTION_AMPLITUDE,
  PLAYER_SIGHT_RANGE,
  RENDER_DEPTH_ENTITY_SPRITE,
  TILE_SIZE_PX,
} from '../const';
import { HUMANOID_BODY_PLAN } from '../health/body-plans/humanoid';
import {
  HumanoidBodyType,
  HumanoidPose,
  humanoidTextureKey,
  resolveHumanoidFacing,
} from '../rendering/humanoid-sprite-generator';
import { StatType } from '../stats/stat-type';
import { EntityType } from '../types';
import { WorldMap } from '../world/world-map';
import { Character } from './character';

export class Player extends Character {
  private readonly worldMap: WorldMap;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private facingAngle = 0;
  private moveDirection = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, worldMap: WorldMap) {
    super(
      scene,
      EntityType.PLAYER,
      x,
      y,
      {
        [StatType.MOVE_SPEED]: PLAYER_MOVE_SPEED,
        [StatType.SIGHT_RANGE]: PLAYER_SIGHT_RANGE,
        [StatType.AIM_ACCURACY]: PLAYER_AIM_ACCURACY,
      },
      HUMANOID_BODY_PLAN,
    );
    this.worldMap = worldMap;
    this.wasd = scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as any;
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = TILE_SIZE_PX;
    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      humanoidTextureKey(HumanoidBodyType.MALE, HumanoidPose.FRONT),
    );
    sprite.setDepth(RENDER_DEPTH_ENTITY_SPRITE);
    return sprite;
  }

  update(deltaTime: number): void {
    this.tickHealth(deltaTime);

    if (!this.health.isDead()) {
      this.updateFacing();
      this.updateMovement(deltaTime);
      this.updateSpriteLean();
    }

    this.updateSpritePosition();
    this.updateHighlightFrame();
  }

  getFacingAngle(): number {
    return this.facingAngle;
  }

  private updateFacing(): void {
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    this.facingAngle = Math.atan2(worldPoint.y - this.sprite.y, worldPoint.x - this.sprite.x);
    this.updateSpritePose();
  }

  private updateSpritePose(): void {
    if (!('setTexture' in this.sprite)) return;

    const { pose, flipX } = resolveHumanoidFacing(this.facingAngle);
    const textureKey = humanoidTextureKey(HumanoidBodyType.MALE, pose);
    if (this.sprite.texture.key !== textureKey) {
      this.sprite.setTexture(textureKey);
    }
    this.sprite.setFlipX(flipX);
  }

  private updateSpriteLean(): void {
    this.sprite.setRotation(HUMANOID_MAX_LEAN_ANGLE * Math.sign(this.moveDirection.x));
  }

  private updateMovement(deltaTime: number): void {
    let moveX = 0;
    let moveY = 0;

    if (this.wasd.left.isDown) moveX -= 1;
    if (this.wasd.right.isDown) moveX += 1;
    if (this.wasd.up.isDown) moveY -= 1;
    if (this.wasd.down.isDown) moveY += 1;

    if (moveX === 0 && moveY === 0) {
      this.moveDirection.set(0, 0);
      return;
    }

    const direction = new Phaser.Math.Vector2(moveX, moveY).normalize();
    this.moveDirection.copy(direction);

    const moveAngle = Math.atan2(moveY, moveX);
    const directionSpeedMultiplier =
      1 + PLAYER_MOVE_SPEED_DIRECTION_AMPLITUDE * Math.cos(this.facingAngle - moveAngle);

    const moveSpeed = this.stats.getValue(StatType.MOVE_SPEED) * directionSpeedMultiplier;
    const distance = moveSpeed * (deltaTime / 1000);

    const nextX = this.position.x + direction.x * distance;
    const nextY = this.position.y + direction.y * distance;

    if (this.worldMap.isWalkable(Math.round(nextX), Math.round(this.position.y))) {
      this.position.x = nextX;
    }
    if (this.worldMap.isWalkable(Math.round(this.position.x), Math.round(nextY))) {
      this.position.y = nextY;
    }
  }

  private updateSpritePosition(): void {
    const tileSize = TILE_SIZE_PX;
    this.sprite.setPosition(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
    );
  }
}
