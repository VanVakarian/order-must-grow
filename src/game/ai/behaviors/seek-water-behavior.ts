import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SeekWaterBehavior extends AIBehavior {
  constructor() {
    super(BehaviorPriority.HIGH, 'Seeking Water');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const thirst = npc.getNeed(NeedType.THIRST);
    return thirst ? thirst.value >= thirst.threshold : false;
  }

  execute(npc: NPCEntity, _deltaTime: number): void {
    const pos = npc.getPosition();

    if (npc.getWorldMap().isNextToWater(pos)) {
      this.drinkWater(npc);
      npc.setTargetPosition(null);
      return;
    }

    const currentTarget = npc.getTargetPosition();

    if (currentTarget) {
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);

      if (distance < 0.1) {
        npc.setTargetPosition(null);
      }
      return;
    }

    const nearestWater = npc.getWorldMap().findNearestWater(pos);
    if (nearestWater) {
      const adjacentPosition = this.findAdjacentWalkablePosition(npc, nearestWater);
      if (adjacentPosition) {
        npc.setTargetPosition(adjacentPosition);
      }
    }
  }

  private findAdjacentWalkablePosition(
    npc: NPCEntity,
    waterPos: { x: number; y: number },
  ): { x: number; y: number } | null {
    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const adjacentX = waterPos.x + dir.x;
      const adjacentY = waterPos.y + dir.y;

      if (npc.getWorldMap().isWalkable(adjacentX, adjacentY)) {
        return { x: adjacentX, y: adjacentY };
      }
    }

    return null;
  }

  private drinkWater(npc: NPCEntity): void {
    npc.setNeedValue(NeedType.THIRST, 0);
  }
}
