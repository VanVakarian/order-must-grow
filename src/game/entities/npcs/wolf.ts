import Phaser from 'phaser';
import { SearchPreyBehavior } from '../../ai/behaviors/search-prey-behavior';
import { SearchWaterBehavior } from '../../ai/behaviors/search-water-behavior';
import { SeekPreyBehavior } from '../../ai/behaviors/seek-prey-behavior';
import { SeekWaterBehavior } from '../../ai/behaviors/seek-water-behavior';
import { WanderBehavior } from '../../ai/behaviors/wander-behavior';
import {
  RENDER_DEPTH_ENTITY_SPRITE,
  TILE_SIZE_PX,
  WOLF_BASE_MOVE_SPEED_MIN,
  WOLF_BASE_MOVE_SPEED_RANDOM_RANGE,
  WOLF_HUNGER_RATE_MIN,
  WOLF_HUNGER_RATE_RANDOM_RANGE,
  WOLF_NEED_THRESHOLD,
  WOLF_PERCEPTION_RADIUS,
  WOLF_SPRITE_HEIGHT_SCALE,
  WOLF_THIRST_RATE_MIN,
  WOLF_THIRST_RATE_RANDOM_RANGE,
  WOLF_URGENT_MOVE_SPEED_MIN,
  WOLF_URGENT_MOVE_SPEED_RANDOM_RANGE,
} from '../../const';
import { EntityType, NeedType } from '../../types';
import { WorldMap } from '../../world/world-map';
import { EntityManager } from '../entity-manager';
import { NPCEntity } from '../npc-entity';

export class Wolf extends NPCEntity {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    worldMap: WorldMap,
    entityManager: EntityManager,
  ) {
    super(scene, EntityType.WOLF, x, y, worldMap, entityManager);
    this.perceptionRadius = WOLF_PERCEPTION_RADIUS;
    this.randomizeParameters();
  }

  private randomizeParameters(): void {
    this.baseMoveSpeed = WOLF_BASE_MOVE_SPEED_MIN + Math.random() * WOLF_BASE_MOVE_SPEED_RANDOM_RANGE;
    this.urgentMoveSpeed = WOLF_URGENT_MOVE_SPEED_MIN + Math.random() * WOLF_URGENT_MOVE_SPEED_RANDOM_RANGE;
    this.moveSpeed = this.baseMoveSpeed;
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = TILE_SIZE_PX;
    const spriteHeight = tileSize * WOLF_SPRITE_HEIGHT_SCALE;

    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      'wolf',
    );

    const source = sprite.texture.getSourceImage() as HTMLImageElement;
    const ratio = source.width / source.height;
    const spriteWidth = spriteHeight * ratio;

    sprite.setDisplaySize(spriteWidth, spriteHeight);
    sprite.setDepth(RENDER_DEPTH_ENTITY_SPRITE);

    return sprite;
  }

  protected initializeNeeds(): void {
    const hungerRate = WOLF_HUNGER_RATE_MIN + Math.random() * WOLF_HUNGER_RATE_RANDOM_RANGE;
    const thirstRate = WOLF_THIRST_RATE_MIN + Math.random() * WOLF_THIRST_RATE_RANDOM_RANGE;

    this.needs.set(NeedType.HUNGER, {
      type: NeedType.HUNGER,
      value: 0,
      threshold: WOLF_NEED_THRESHOLD,
      changeRate: hungerRate,
    });
    this.needs.set(NeedType.THIRST, {
      type: NeedType.THIRST,
      value: 0,
      threshold: WOLF_NEED_THRESHOLD,
      changeRate: thirstRate,
    });
  }

  protected initializeBehaviors(): void {
    this.behaviors.push(new SeekPreyBehavior());
    this.behaviors.push(new SeekWaterBehavior());
    this.behaviors.push(new SearchPreyBehavior());
    this.behaviors.push(new SearchWaterBehavior());
    this.behaviors.push(new WanderBehavior());
  }
}
