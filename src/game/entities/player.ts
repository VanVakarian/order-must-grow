import Phaser from 'phaser';
import { WeaponType } from '../combat/weapon-type';
import {
  HUMANOID_MAX_LEAN_ANGLE,
  PLAYER_ACCELERATION_MPS2,
  PLAYER_AIM_ACCURACY,
  PLAYER_BACKWARD_SPEED_PENALTY,
  PLAYER_DECELERATION_MPS2,
  PLAYER_RUN_SPEED,
  PLAYER_SIGHT_RANGE,
  PLAYER_WALK_SPEED,
  TILE_SIZE_PX,
  WEAPON_MOVE_SWAY_OFFSET_PX,
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
import { WorldQuery } from '../world/world-query';
import { Character } from './character';
import { EntityManager } from './entity-manager';

export class Player extends Character {
  private readonly worldMap: WorldMap;
  private readonly worldQuery: WorldQuery;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private readonly runKey: Phaser.Input.Keyboard.Key;
  private moveDirection = new Phaser.Math.Vector2(0, 0);
  // Направление, в котором персонаж реально едет по инерции — в отличие от moveDirection
  // (мгновенный ввод, используется для наклона/раскачки), не обнуляется при отпускании клавиш,
  // чтобы было куда катиться, пока currentSpeed плавно тормозит до нуля.
  private heading = new Phaser.Math.Vector2(0, -1);
  private currentSpeed = 0;
  private facingMoveAlignment = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    worldMap: WorldMap,
    entityManager: EntityManager,
  ) {
    super(
      scene,
      EntityType.PLAYER,
      x,
      y,
      {
        [StatType.MOVE_SPEED]: PLAYER_WALK_SPEED,
        [StatType.SIGHT_RANGE]: PLAYER_SIGHT_RANGE,
        [StatType.AIM_ACCURACY]: PLAYER_AIM_ACCURACY,
      },
      HUMANOID_BODY_PLAN,
    );
    this.worldMap = worldMap;
    this.worldQuery = new WorldQuery(worldMap, entityManager);
    this.wasd = scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as any;
    this.runKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.equipWeapon(WeaponType.KNIFE);
    this.setupAttackInput();
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = TILE_SIZE_PX;
    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      humanoidTextureKey(HumanoidBodyType.MALE, HumanoidPose.FRONT),
    );
    return sprite;
  }

  update(deltaTime: number): void {
    this.tickHealth(deltaTime);

    if (!this.health.isDead()) {
      this.updateFacing();
      this.updateMovement(deltaTime);
      this.updateSpriteLean();
      this.weaponSwayOffsetX = WEAPON_MOVE_SWAY_OFFSET_PX * Math.sign(this.moveDirection.x);
    }

    this.updateSpritePosition();
    this.tickCombat(deltaTime);
    this.updateHighlightFrame();
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
    const leanRatio = (this.facingMoveAlignment + 1) / 2;
    this.sprite.setRotation(HUMANOID_MAX_LEAN_ANGLE * leanRatio * Math.sign(this.moveDirection.x));
  }

  private updateMovement(deltaTime: number): void {
    let moveX = 0;
    let moveY = 0;

    if (this.wasd.left.isDown) moveX -= 1;
    if (this.wasd.right.isDown) moveX += 1;
    if (this.wasd.up.isDown) moveY -= 1;
    if (this.wasd.down.isDown) moveY += 1;

    const hasInput = moveX !== 0 || moveY !== 0;
    let targetSpeed = 0;

    if (hasInput) {
      const direction = new Phaser.Math.Vector2(moveX, moveY).normalize();
      this.moveDirection.copy(direction);
      this.heading.copy(direction);

      const moveAngle = Math.atan2(moveY, moveX);
      this.facingMoveAlignment = Math.cos(this.facingAngle - moveAngle);
      // 1 при движении точно по взгляду (без буста), проседает до (1 - PENALTY) при движении спиной.
      const directionSpeedMultiplier =
        1 - (PLAYER_BACKWARD_SPEED_PENALTY * (1 - this.facingMoveAlignment)) / 2;

      const runMultiplier = this.runKey.isDown ? PLAYER_RUN_SPEED / PLAYER_WALK_SPEED : 1;
      targetSpeed =
        this.stats.getValue(StatType.MOVE_SPEED) * runMultiplier * directionSpeedMultiplier;
    } else {
      this.moveDirection.set(0, 0);
    }

    // Текущая скорость плавно тянется к целевой, а не переключается скачком — разгон и торможение
    // (в т.ч. между ходьбой и бегом) идут с разным темпом, торможение быстрее разгона.
    const accelerationRate =
      targetSpeed > this.currentSpeed ? PLAYER_ACCELERATION_MPS2 : PLAYER_DECELERATION_MPS2;
    const maxSpeedStep = accelerationRate * (deltaTime / 1000);
    const speedDelta = targetSpeed - this.currentSpeed;
    this.currentSpeed += Math.sign(speedDelta) * Math.min(Math.abs(speedDelta), maxSpeedStep);

    if (this.currentSpeed <= 0) return;

    const distance = this.currentSpeed * (deltaTime / 1000);
    const nextX = this.position.x + this.heading.x * distance;
    const nextY = this.position.y + this.heading.y * distance;

    if (this.worldMap.isWalkable(Math.round(nextX), Math.round(this.position.y))) {
      this.position.x = nextX;
    }
    if (this.worldMap.isWalkable(Math.round(this.position.x), Math.round(nextY))) {
      this.position.y = nextY;
    }
  }

  private setupAttackInput(): void {
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown() || (pointer.event as MouseEvent | undefined)?.ctrlKey) return;
      if (this.health.isDead()) return;

      const weapon = this.combat.getWeapon();
      if (!weapon) return;

      const target = this.worldQuery.findNearestEntity(
        this.position,
        weapon.attackRangeTiles,
        (entity) => entity.getType() === EntityType.ENEMY,
      ) as Character | null;

      this.tryAttack(target);
    });
  }
}
