import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, EntityType, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SearchPreyBehavior extends AIBehavior {
  private searchTimer: number = 0;
  private searchInterval: number = 5000;
  private searchAngle: number | null = null;
  private traveledDistance: number = 0;
  private maxTravelBeforeTurn: number = 20;
  private lastPosition: { x: number; y: number } | null = null;

  constructor() {
    super(BehaviorPriority.MEDIUM, 'Searching Prey');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const hunger = npc.getNeed(NeedType.HUNGER);
    if (!hunger || hunger.value < hunger.threshold) return false;
    const prey = npc
      .getWorldQuery()
      .findNearestEntity(
        npc.getPosition(),
        npc.getPerceptionRadius(),
        (entity) => entity.getType() === EntityType.RABBIT,
      );
    return prey === null;
  }

  execute(npc: NPCEntity, deltaTime: number): void {
    const currentTarget = npc.getTargetPosition();
    const pos = npc.getPosition();
    this.updateTravel(pos);
    if (currentTarget) {
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);
      if (distance < 0.1) {
        npc.setTargetPosition(null);
      }
    }

    this.searchTimer += deltaTime;
    const shouldTurn = this.traveledDistance >= this.maxTravelBeforeTurn;
    if (!currentTarget || this.searchTimer >= this.searchInterval || shouldTurn) {
      if (shouldTurn) {
        this.turnSearchAngle();
        this.traveledDistance = 0;
      }
      this.searchTimer = 0;
      this.setSearchTarget(npc, pos);
    }
  }

  private setSearchTarget(npc: NPCEntity, pos: { x: number; y: number }): void {
    const worldMap = npc.getWorldMap();
    const searchDistance = Math.max(4, Math.round(npc.getPerceptionRadius() * 1.5));
    const maxX = worldMap.getWidth() - 1;
    const maxY = worldMap.getHeight() - 1;

    if (this.searchAngle === null) {
      this.searchAngle = Math.random() * Math.PI * 2;
    }

    for (let i = 0; i < 10; i++) {
      const angle = this.searchAngle ?? Math.random() * Math.PI * 2;
      const targetX = Math.round(pos.x + Math.cos(angle) * searchDistance);
      const targetY = Math.round(pos.y + Math.sin(angle) * searchDistance);
      const clampedX = Math.min(maxX, Math.max(0, targetX));
      const clampedY = Math.min(maxY, Math.max(0, targetY));
      const wasClamped = clampedX !== targetX || clampedY !== targetY;

      if (worldMap.isWalkable(clampedX, clampedY)) {
        npc.setTargetPosition({ x: clampedX, y: clampedY });
        if (npc.getTargetPosition()) {
          if (wasClamped) {
            this.reverseSearchAngle();
          }
          return;
        }
        this.searchAngle = Math.random() * Math.PI * 2;
        return;
      }

      this.searchAngle = Math.random() * Math.PI * 2;
    }
  }

  private updateTravel(pos: { x: number; y: number }): void {
    if (!this.lastPosition) {
      this.lastPosition = { x: pos.x, y: pos.y };
      return;
    }

    const dist = Math.hypot(pos.x - this.lastPosition.x, pos.y - this.lastPosition.y);
    this.traveledDistance += dist;
    this.lastPosition = { x: pos.x, y: pos.y };
  }

  private turnSearchAngle(): void {
    if (this.searchAngle === null) {
      this.searchAngle = Math.random() * Math.PI * 2;
      return;
    }

    const direction = Math.random() < 0.5 ? -1 : 1;
    this.searchAngle = this.normalizeAngle(this.searchAngle + direction * (Math.PI / 4));
  }

  private reverseSearchAngle(): void {
    if (this.searchAngle === null) return;
    this.searchAngle = this.normalizeAngle(this.searchAngle + Math.PI);
  }

  private normalizeAngle(angle: number): number {
    const full = Math.PI * 2;
    const wrapped = angle % full;
    return wrapped < 0 ? wrapped + full : wrapped;
  }
}
