import Phaser from 'phaser';
import { SeekFoodBehavior } from '../../ai/behaviors/seek-food-behavior';
import { WanderBehavior } from '../../ai/behaviors/wander-behavior';
import { EntityType, NeedType } from '../../types';
import { WorldMap } from '../../world/world-map';
import { NPCEntity } from '../npc-entity';

export class Rabbit extends NPCEntity {
  constructor(scene: Phaser.Scene, x: number, y: number, worldMap: WorldMap) {
    super(scene, EntityType.RABBIT, x, y, worldMap);
  }

  protected createSprite(): Phaser.GameObjects.Rectangle {
    const tileSize = 48;
    const rabbitSize = tileSize * 0.7;

    const sprite = this.scene.add.rectangle(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
      rabbitSize,
      rabbitSize,
      0xffffff,
    );

    sprite.setDepth(10);

    return sprite;
  }

  protected initializeNeeds(): void {
    this.needs.set(NeedType.HUNGER, {
      type: NeedType.HUNGER,
      value: 0,
      threshold: 60,
      changeRate: 5,
    });
  }

  protected initializeBehaviors(): void {
    this.behaviors.push(new SeekFoodBehavior());
    this.behaviors.push(new WanderBehavior());
  }
}
