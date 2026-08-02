import {
  AI_RETARGET_IMPROVEMENT_MARGIN,
  AI_SEEK_ARRIVAL_DISTANCE,
  AI_SEEK_RETARGET_INTERVAL_MS,
} from '../../const';
import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SeekFoodBehavior extends AIBehavior {
  private retargetTimer: number = 0;
  private retargetInterval: number = AI_SEEK_RETARGET_INTERVAL_MS;

  constructor() {
    super(BehaviorPriority.HIGH, 'Seeking Food');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const hunger = npc.getNeed(NeedType.HUNGER);
    if (!hunger || hunger.value < hunger.threshold) return false;
    if (npc.getTargetPosition()) return true;
    const visibleFood = npc
      .getWorldQuery()
      .findNearestVegetation(npc.getPosition(), npc.getPerceptionRadius());
    return visibleFood !== null;
  }

  execute(npc: NPCEntity, deltaTime: number): void {
    const currentTarget = npc.getTargetPosition();
    this.retargetTimer += deltaTime;

    if (this.retargetTimer >= this.retargetInterval) {
      this.retargetTimer = 0;
      this.tryRetarget(npc, currentTarget);
    }

    if (currentTarget) {
      const pos = npc.getPosition();
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);

      if (distance < AI_SEEK_ARRIVAL_DISTANCE) {
        this.eatFood(npc, currentTarget);
        npc.setTargetPosition(null);
      }

      const tile = npc
        .getWorldMap()
        .getTile(Math.floor(currentTarget.x), Math.floor(currentTarget.y));
      if (!tile.vegetation) {
        npc.setTargetPosition(null);
      }
      return;
    }

    const nearestFood = npc
      .getWorldQuery()
      .findNearestVegetation(npc.getPosition(), npc.getPerceptionRadius());
    if (nearestFood) {
      npc.setTargetPosition(nearestFood);
    }
  }

  private tryRetarget(npc: NPCEntity, currentTarget: { x: number; y: number } | null): void {
    const nearestFood = npc
      .getWorldQuery()
      .findNearestVegetation(npc.getPosition(), npc.getPerceptionRadius());

    if (!nearestFood) return;

    if (!currentTarget) {
      npc.setTargetPosition(nearestFood);
      return;
    }

    const pos = npc.getPosition();
    const currentDist = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);
    const nextDist = Math.hypot(nearestFood.x - pos.x, nearestFood.y - pos.y);

    if (nextDist + AI_RETARGET_IMPROVEMENT_MARGIN < currentDist) {
      npc.setTargetPosition(nearestFood);
    }
  }

  private eatFood(npc: NPCEntity, pos: { x: number; y: number }): void {
    const tileX = Math.floor(pos.x);
    const tileY = Math.floor(pos.y);

    const tile = npc.getWorldMap().getTile(tileX, tileY);
    if (tile.vegetation) {
      npc.getWorldMap().removeVegetation(tileX, tileY);
      npc.setNeedValue(NeedType.HUNGER, 0);
    }
  }
}
