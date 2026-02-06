import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SeekWaterBehavior extends AIBehavior {
  private retargetTimer: number = 0;
  private retargetInterval: number = 500;

  constructor() {
    super(BehaviorPriority.HIGH, 'Seeking Water');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const thirst = npc.getNeed(NeedType.THIRST);
    if (!thirst || thirst.value < thirst.threshold) return false;
    if (npc.getTargetPosition()) return true;
    const visibleWater = npc
      .getWorldQuery()
      .findNearestWater(npc.getPosition(), npc.getPerceptionRadius());
    return visibleWater !== null;
  }

  execute(npc: NPCEntity, deltaTime: number): void {
    const pos = npc.getPosition();

    if (npc.getWorldMap().isNextToWater(pos)) {
      this.drinkWater(npc);
      npc.setTargetPosition(null);
      return;
    }

    const currentTarget = npc.getTargetPosition();

    this.retargetTimer += deltaTime;
    if (this.retargetTimer >= this.retargetInterval) {
      this.retargetTimer = 0;
      this.tryRetarget(npc, currentTarget);
    }

    if (currentTarget) {
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);

      if (distance < 0.1) {
        npc.setTargetPosition(null);
      }
      return;
    }

    const nearestWater = npc.getWorldQuery().findNearestWater(pos, npc.getPerceptionRadius());
    if (nearestWater) {
      const adjacentPosition = this.findAdjacentWalkablePosition(npc, nearestWater);
      if (adjacentPosition) {
        npc.setTargetPosition(adjacentPosition);
      }
    }
  }

  private tryRetarget(npc: NPCEntity, currentTarget: { x: number; y: number } | null): void {
    const pos = npc.getPosition();
    const nearestWater = npc.getWorldQuery().findNearestWater(pos, npc.getPerceptionRadius());
    if (!nearestWater) return;

    const adjacentPosition = this.findAdjacentWalkablePosition(npc, nearestWater);
    if (!adjacentPosition) return;

    if (!currentTarget) {
      npc.setTargetPosition(adjacentPosition);
      return;
    }

    const currentDist = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);
    const nextDist = Math.hypot(adjacentPosition.x - pos.x, adjacentPosition.y - pos.y);
    if (nextDist + 0.1 < currentDist) {
      npc.setTargetPosition(adjacentPosition);
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
