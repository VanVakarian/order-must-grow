import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, EntityType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class FleePredatorBehavior extends AIBehavior {
  private retargetTimer: number = 0;
  private retargetInterval: number = 400;

  constructor() {
    super(BehaviorPriority.CRITICAL, 'Fleeing');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const predator = this.findNearestPredator(npc);
    return predator !== null;
  }

  override onEnter(npc: NPCEntity): void {
    npc.setMoveSpeedOverride(npc.getUrgentMoveSpeed());
  }

  override onExit(npc: NPCEntity): void {
    npc.setMoveSpeedOverride(null);
    npc.setTargetPosition(null);
  }

  execute(npc: NPCEntity, deltaTime: number): void {
    const predator = this.findNearestPredator(npc);
    if (!predator) {
      npc.setTargetPosition(null);
      return;
    }

    this.retargetTimer += deltaTime;
    const currentTarget = npc.getTargetPosition();

    if (!currentTarget || this.retargetTimer >= this.retargetInterval) {
      this.retargetTimer = 0;
      const target = this.pickFleeTarget(npc, predator.getPosition());
      if (target) {
        npc.setTargetPosition(target);
      }
    }
  }

  private findNearestPredator(npc: NPCEntity) {
    return npc
      .getWorldQuery()
      .findNearestEntity(
        npc.getPosition(),
        npc.getPerceptionRadius(),
        (entity) => entity.getType() === EntityType.WOLF,
      );
  }

  private pickFleeTarget(npc: NPCEntity, predatorPos: { x: number; y: number }) {
    const pos = npc.getPosition();
    const worldMap = npc.getWorldMap();
    const fleeDistance = Math.max(4, Math.round(npc.getPerceptionRadius() * 0.6));

    let baseAngle = Math.atan2(pos.y - predatorPos.y, pos.x - predatorPos.x);
    if (Number.isNaN(baseAngle)) {
      baseAngle = Math.random() * Math.PI * 2;
    }

    const offsets = [0, 1, -1, 2, -2, 3, -3, 4].map((step) => step * (Math.PI / 4));

    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const targetX = Math.round(pos.x + Math.cos(angle) * fleeDistance);
      const targetY = Math.round(pos.y + Math.sin(angle) * fleeDistance);

      if (worldMap.isWalkable(targetX, targetY)) {
        return { x: targetX, y: targetY };
      }
    }

    return null;
  }
}
