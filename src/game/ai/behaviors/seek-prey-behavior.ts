import {
  AI_RETARGET_IMPROVEMENT_MARGIN,
  AI_SEEK_PREY_KILL_DISTANCE,
  AI_SEEK_PREY_KILL_RADIUS,
  AI_SEEK_PREY_RETARGET_INTERVAL_MS,
} from '../../const';
import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, EntityType, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SeekPreyBehavior extends AIBehavior {
  private retargetTimer: number = 0;
  private retargetInterval: number = AI_SEEK_PREY_RETARGET_INTERVAL_MS;
  private currentPreyId: string | null = null;

  constructor() {
    super(BehaviorPriority.HIGH, 'Hunting');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const hunger = npc.getNeed(NeedType.HUNGER);
    if (!hunger || hunger.value < hunger.threshold) return false;
    if (npc.getTargetPosition()) return true;
    const prey = this.findNearestPrey(npc);
    return prey !== null;
  }

  execute(npc: NPCEntity, deltaTime: number): void {
    this.retargetTimer += deltaTime;
    const currentTarget = npc.getTargetPosition();

    if (this.retargetTimer >= this.retargetInterval) {
      this.retargetTimer = 0;
      this.tryRetarget(npc, currentTarget);
    }

    if (currentTarget) {
      const pos = npc.getPosition();
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);
      if (distance < AI_SEEK_PREY_KILL_DISTANCE) {
        this.tryKillPrey(npc);
        npc.setTargetPosition(null);
      }
      return;
    }

    const prey = this.findNearestPrey(npc);
    if (prey) {
      this.currentPreyId = prey.getId();
      npc.setTargetPosition(prey.getPosition());
    }
  }

  private tryRetarget(npc: NPCEntity, currentTarget: { x: number; y: number } | null): void {
    const prey = this.findNearestPrey(npc);
    if (!prey) {
      this.currentPreyId = null;
      if (currentTarget) {
        npc.setTargetPosition(null);
      }
      return;
    }

    const nextTarget = prey.getPosition();
    if (!currentTarget) {
      this.currentPreyId = prey.getId();
      npc.setTargetPosition(nextTarget);
      return;
    }

    const pos = npc.getPosition();
    const currentDist = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);
    const nextDist = Math.hypot(nextTarget.x - pos.x, nextTarget.y - pos.y);

    if (nextDist + AI_RETARGET_IMPROVEMENT_MARGIN < currentDist || prey.getId() !== this.currentPreyId) {
      this.currentPreyId = prey.getId();
      npc.setTargetPosition(nextTarget);
    }
  }

  private findNearestPrey(npc: NPCEntity) {
    return npc
      .getWorldQuery()
      .findNearestEntity(
        npc.getPosition(),
        npc.getPerceptionRadius(),
        (entity) => entity.getType() === EntityType.RABBIT,
      );
  }

  private tryKillPrey(npc: NPCEntity): void {
    const prey = npc
      .getWorldQuery()
      .findNearestEntity(
        npc.getPosition(),
        AI_SEEK_PREY_KILL_RADIUS,
        (entity) => entity.getType() === EntityType.RABBIT,
      );

    if (!prey) return;

    npc.getEntityManager().removeEntity(prey.getId());
    npc.setNeedValue(NeedType.HUNGER, 0);
  }
}
