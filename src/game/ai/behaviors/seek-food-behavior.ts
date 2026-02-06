import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SeekFoodBehavior extends AIBehavior {
  constructor() {
    super(BehaviorPriority.HIGH, 'Seeking Food');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const hunger = npc.getNeed(NeedType.HUNGER);
    return hunger ? hunger.value >= hunger.threshold : false;
  }

  execute(npc: NPCEntity, _deltaTime: number): void {
    const currentTarget = npc.getTargetPosition();

    if (currentTarget) {
      const pos = npc.getPosition();
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);

      if (distance < 0.1) {
        this.eatFood(npc, currentTarget);
        npc.setTargetPosition(null);
      }
      return;
    }

    const nearestFood = npc.getWorldMap().findNearestVegetation(npc.getPosition());
    if (nearestFood) {
      npc.setTargetPosition(nearestFood);
    }
  }

  private eatFood(npc: NPCEntity, pos: { x: number; y: number }): void {
    const tileX = Math.floor(pos.x);
    const tileY = Math.floor(pos.y);

    const tile = npc.getWorldMap().getTile(tileX, tileY);
    if (tile && tile.vegetation) {
      npc.getWorldMap().removeVegetation(tileX, tileY);
      npc.setNeedValue(NeedType.HUNGER, 0);
    }
  }
}
