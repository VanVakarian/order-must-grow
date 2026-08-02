import Phaser from 'phaser';
import { FleePredatorBehavior } from '../../ai/behaviors/flee-predator-behavior';
import { SearchFoodBehavior } from '../../ai/behaviors/search-food-behavior';
import { SearchWaterBehavior } from '../../ai/behaviors/search-water-behavior';
import { SeekFoodBehavior } from '../../ai/behaviors/seek-food-behavior';
import { SeekWaterBehavior } from '../../ai/behaviors/seek-water-behavior';
import { WanderBehavior } from '../../ai/behaviors/wander-behavior';
import {
  RABBIT_BASE_MOVE_SPEED_MIN,
  RABBIT_BASE_MOVE_SPEED_RANDOM_RANGE,
  RABBIT_HUNGER_RATE_MIN,
  RABBIT_HUNGER_RATE_RANDOM_RANGE,
  RABBIT_NEED_THRESHOLD,
  RABBIT_PERCEPTION_RADIUS,
  RABBIT_SPRITE_HEIGHT_SCALE,
  RABBIT_THIRST_RATE_MIN,
  RABBIT_THIRST_RATE_RANDOM_RANGE,
  RABBIT_URGENT_MOVE_SPEED_MIN,
  RABBIT_URGENT_MOVE_SPEED_RANDOM_RANGE,
  RENDER_DEPTH_ENTITY_SPRITE,
  TILE_SIZE_PX,
} from '../../const';
import { EntityType, NeedType } from '../../types';
import { WorldMap } from '../../world/world-map';
import { EntityManager } from '../entity-manager';
import { NPCEntity } from '../npc-entity';

export class Rabbit extends NPCEntity {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    worldMap: WorldMap,
    entityManager: EntityManager,
  ) {
    super(scene, EntityType.RABBIT, x, y, worldMap, entityManager);
    this.perceptionRadius = RABBIT_PERCEPTION_RADIUS;
    this.randomizeParameters();
  }

  private randomizeParameters(): void {
    this.baseMoveSpeed = RABBIT_BASE_MOVE_SPEED_MIN + Math.random() * RABBIT_BASE_MOVE_SPEED_RANDOM_RANGE;
    this.urgentMoveSpeed = RABBIT_URGENT_MOVE_SPEED_MIN + Math.random() * RABBIT_URGENT_MOVE_SPEED_RANDOM_RANGE;
    this.moveSpeed = this.baseMoveSpeed;
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = TILE_SIZE_PX;
    const spriteHeight = tileSize * RABBIT_SPRITE_HEIGHT_SCALE;

    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      'rabbit',
    );

    const source = sprite.texture.getSourceImage() as HTMLImageElement;
    const ratio = source.width / source.height;
    const spriteWidth = spriteHeight * ratio;

    sprite.setDisplaySize(spriteWidth, spriteHeight);
    sprite.setDepth(RENDER_DEPTH_ENTITY_SPRITE);

    return sprite;
  }

  protected initializeNeeds(): void {
    const hungerRate = RABBIT_HUNGER_RATE_MIN + Math.random() * RABBIT_HUNGER_RATE_RANDOM_RANGE;
    const thirstRate = RABBIT_THIRST_RATE_MIN + Math.random() * RABBIT_THIRST_RATE_RANDOM_RANGE;

    this.needs.set(NeedType.HUNGER, {
      type: NeedType.HUNGER,
      value: 0,
      threshold: RABBIT_NEED_THRESHOLD,
      changeRate: hungerRate,
    });
    this.needs.set(NeedType.THIRST, {
      type: NeedType.THIRST,
      value: 0,
      threshold: RABBIT_NEED_THRESHOLD,
      changeRate: thirstRate,
    });
  }

  protected initializeBehaviors(): void {
    this.behaviors.push(new FleePredatorBehavior());
    this.behaviors.push(new SeekFoodBehavior());
    this.behaviors.push(new SeekWaterBehavior());
    this.behaviors.push(new SearchFoodBehavior());
    this.behaviors.push(new SearchWaterBehavior());
    this.behaviors.push(new WanderBehavior());
  }
}
