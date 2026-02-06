import Phaser from 'phaser';
import { SeekFoodBehavior } from '../../ai/behaviors/seek-food-behavior';
import { SeekWaterBehavior } from '../../ai/behaviors/seek-water-behavior';
import { WanderBehavior } from '../../ai/behaviors/wander-behavior';
import { EntityType, NeedType } from '../../types';
import { WorldMap } from '../../world/world-map';
import { NPCEntity } from '../npc-entity';

export class Rabbit extends NPCEntity {
  constructor(scene: Phaser.Scene, x: number, y: number, worldMap: WorldMap) {
    super(scene, EntityType.RABBIT, x, y, worldMap);
    this.randomizeParameters();
  }

  private randomizeParameters(): void {
    this.baseMoveSpeed = 0.8 + Math.random() * 0.4;
    this.urgentMoveSpeed = 3.0 + Math.random() * 1.0;
    this.moveSpeed = this.baseMoveSpeed;
  }

  protected createSprite(): Phaser.GameObjects.Image {
    const tileSize = 48;

    const sprite = this.scene.add.image(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      'rabbit',
    );

    sprite.setDepth(10);

    return sprite;
  }

  protected initializeNeeds(): void {
    const hungerRate = 0.7 + Math.random() * 0.6;
    const thirstRate = 0.7 + Math.random() * 0.6;

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
    this.behaviors.push(new SeekFoodBehavior());
    this.behaviors.push(new SeekWaterBehavior());
    this.behaviors.push(new WanderBehavior());
  }
}
