import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SearchFoodBehavior extends AIBehavior {
  private searchTimer: number = 0;
  private searchInterval: number = 5000;
  private searchAngle: number | null = null;
  private traveledDistance: number = 0;
  private maxTravelBeforeTurn: number = 20;
  private lastPosition: { x: number; y: number } | null = null;

  constructor() {
    super(BehaviorPriority.MEDIUM, 'Searching Food');
  }

  shouldExecute(npc: NPCEntity): boolean {
    const hunger = npc.getNeed(NeedType.HUNGER);
    if (!hunger || hunger.value < hunger.threshold) return false;
    const visibleFood = npc
      .getWorldQuery()
      .findNearestVegetation(npc.getPosition(), npc.getPerceptionRadius());
    return visibleFood === null;
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

    if (this.searchAngle === null) {
      this.searchAngle = Math.random() * Math.PI * 2;
    }

    for (let i = 0; i < 10; i++) {
      const angle = this.searchAngle ?? Math.random() * Math.PI * 2;
      const targetX = Math.round(pos.x + Math.cos(angle) * searchDistance);
      const targetY = Math.round(pos.y + Math.sin(angle) * searchDistance);

      if (worldMap.isWalkable(targetX, targetY)) {
        npc.setTargetPosition({ x: targetX, y: targetY });
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

  private normalizeAngle(angle: number): number {
    const full = Math.PI * 2;
    const wrapped = angle % full;
    return wrapped < 0 ? wrapped + full : wrapped;
  }
}
