import Phaser from 'phaser';
import { SearchPreyBehavior } from '../../ai/behaviors/search-prey-behavior';
import { SearchWaterBehavior } from '../../ai/behaviors/search-water-behavior';
import { SeekPreyBehavior } from '../../ai/behaviors/seek-prey-behavior';
import { SeekWaterBehavior } from '../../ai/behaviors/seek-water-behavior';
import { WanderBehavior } from '../../ai/behaviors/wander-behavior';
import { npcSpriteConfig } from '../../config/npc-sprites';
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
    this.perceptionRadius = 10;
    this.randomizeParameters();
  }

  private randomizeParameters(): void {
    this.baseMoveSpeed = 0.9 + Math.random() * 0.2;
    this.urgentMoveSpeed = 3.0 + Math.random() * 0.6;
    this.moveSpeed = this.baseMoveSpeed;
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = 48;
    const spriteHeight = tileSize * npcSpriteConfig.wolf.heightScale;

    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      'wolf',
    );

    const source = sprite.texture.getSourceImage() as HTMLImageElement;
    const ratio = source.width / source.height;
    const spriteWidth = spriteHeight * ratio;

    sprite.setDisplaySize(spriteWidth, spriteHeight);
    sprite.setDepth(10);

    return sprite;
  }

  protected initializeNeeds(): void {
    const hungerRate = 0.8 + Math.random() * 0.6;
    const thirstRate = 0.7 + Math.random() * 0.5;

    this.needs.set(NeedType.HUNGER, {
      type: NeedType.HUNGER,
      value: 0,
      threshold: 60,
      changeRate: hungerRate,
    });
    this.needs.set(NeedType.THIRST, {
      type: NeedType.THIRST,
      value: 0,
      threshold: 60,
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
