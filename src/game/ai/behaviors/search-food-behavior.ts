import {
  AI_MOVEMENT_ARRIVAL_DISTANCE,
  AI_SEARCH_DIRECTION_TURN_ANGLE_RAD,
  AI_SEARCH_DISTANCE_PERCEPTION_MULTIPLIER,
  AI_SEARCH_INTERVAL_MS,
  AI_SEARCH_MAX_ATTEMPTS,
  AI_SEARCH_MAX_TRAVEL_BEFORE_TURN,
  AI_SEARCH_MIN_DISTANCE,
} from '../../const';
import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority, NeedType } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class SearchFoodBehavior extends AIBehavior {
  private searchTimer: number = 0;
  private searchInterval: number = AI_SEARCH_INTERVAL_MS;
  private searchAngle: number | null = null;
  private traveledDistance: number = 0;
  private maxTravelBeforeTurn: number = AI_SEARCH_MAX_TRAVEL_BEFORE_TURN;
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
      if (distance < AI_MOVEMENT_ARRIVAL_DISTANCE) {
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
    const searchDistance = Math.max(
      AI_SEARCH_MIN_DISTANCE,
      Math.round(npc.getPerceptionRadius() * AI_SEARCH_DISTANCE_PERCEPTION_MULTIPLIER),
    );

    if (this.searchAngle === null) {
      this.searchAngle = Math.random() * Math.PI * 2;
    }

    for (let i = 0; i < AI_SEARCH_MAX_ATTEMPTS; i++) {
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
    this.searchAngle = this.normalizeAngle(this.searchAngle + direction * AI_SEARCH_DIRECTION_TURN_ANGLE_RAD);
  }

  private normalizeAngle(angle: number): number {
    const full = Math.PI * 2;
    const wrapped = angle % full;
    return wrapped < 0 ? wrapped + full : wrapped;
  }
}
