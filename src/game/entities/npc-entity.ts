import Phaser from 'phaser';
import { AIBehavior } from '../ai/ai-behavior';
import {
  NPC_DEFAULT_BASE_MOVE_SPEED,
  NPC_DEFAULT_PERCEPTION_RADIUS,
  NPC_DEFAULT_URGENT_MOVE_SPEED,
  NPC_DIRECTION_CHANGE_THRESHOLD,
  NPC_NEED_MAX_VALUE,
  NPC_WAYPOINT_ARRIVAL_DISTANCE,
} from '../const';
import { EntityType, Need, NeedType, Position } from '../types';
import { WorldMap } from '../world/world-map';
import { WorldQuery } from '../world/world-query';
import { Entity } from './entity';
import { EntityManager } from './entity-manager';

export abstract class NPCEntity extends Entity {
  protected needs: Map<NeedType, Need>;
  protected behaviors: AIBehavior[];
  protected currentBehavior: AIBehavior | null;
  protected worldMap: WorldMap;
  protected entityManager: EntityManager;
  protected worldQuery: WorldQuery;
  protected targetPosition: Position | null;
  protected path: Position[];
  protected currentWaypoint: Position | null;
  protected moveSpeed: number;
  protected baseMoveSpeed: number;
  protected urgentMoveSpeed: number;
  protected moveSpeedOverride: number | null;
  protected perceptionRadius: number;
  protected lastDirection: number = 1;

  constructor(
    scene: Phaser.Scene,
    type: EntityType,
    x: number,
    y: number,
    worldMap: WorldMap,
    entityManager: EntityManager,
  ) {
    super(scene, type, x, y);
    this.needs = new Map();
    this.behaviors = [];
    this.currentBehavior = null;
    this.worldMap = worldMap;
    this.entityManager = entityManager;
    this.worldQuery = new WorldQuery(worldMap, entityManager);
    this.targetPosition = null;
    this.path = [];
    this.currentWaypoint = null;
    this.baseMoveSpeed = NPC_DEFAULT_BASE_MOVE_SPEED;
    this.urgentMoveSpeed = NPC_DEFAULT_URGENT_MOVE_SPEED;
    this.moveSpeed = this.baseMoveSpeed;
    this.moveSpeedOverride = null;
    this.perceptionRadius = NPC_DEFAULT_PERCEPTION_RADIUS;
    this.initializeNeeds();
    this.initializeBehaviors();
  }

  protected abstract initializeNeeds(): void;
  protected abstract initializeBehaviors(): void;

  update(deltaTime: number): void {
    this.updateNeeds(deltaTime);
    this.updateMoveSpeed();
    this.updateAI(deltaTime);
    this.updateMovement(deltaTime);
    this.updateSpritePosition();
    this.updateHighlightFrame();
  }

  protected updateMoveSpeed(): void {
    if (this.moveSpeedOverride !== null) {
      this.moveSpeed = this.moveSpeedOverride;
      return;
    }

    const hunger = this.needs.get(NeedType.HUNGER);
    const thirst = this.needs.get(NeedType.THIRST);

    const isHungry = hunger && hunger.value >= hunger.threshold;
    const isThirsty = thirst && thirst.value >= thirst.threshold;

    if (isHungry || isThirsty) {
      this.moveSpeed = this.urgentMoveSpeed;
    } else {
      this.moveSpeed = this.baseMoveSpeed;
    }
  }

  protected updateNeeds(deltaTime: number): void {
    for (const need of this.needs.values()) {
      need.value = Math.min(NPC_NEED_MAX_VALUE, need.value + need.changeRate * (deltaTime / 1000));
    }
  }

  protected updateAI(deltaTime: number): void {
    this.behaviors.sort((a, b) => b.getPriority() - a.getPriority());

    for (const behavior of this.behaviors) {
      if (behavior.shouldExecute(this)) {
        if (this.currentBehavior !== behavior) {
          this.currentBehavior?.onExit?.(this);
          this.currentBehavior = behavior;
          this.currentBehavior.onEnter?.(this);
        }
        this.currentBehavior.execute(this, deltaTime);
        return;
      }
    }

    this.currentBehavior = null;
  }

  protected updateMovement(deltaTime: number): void {
    if (!this.currentWaypoint) return;

    const dx = this.currentWaypoint.x - this.position.x;
    const dy = this.currentWaypoint.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance < NPC_WAYPOINT_ARRIVAL_DISTANCE) {
      this.position.x = this.currentWaypoint.x;
      this.position.y = this.currentWaypoint.y;
      if (this.path.length > 0) {
        this.currentWaypoint = this.path.shift() as Position;
      } else {
        this.currentWaypoint = null;
      }
      return;
    }

    const moveAmount = this.moveSpeed * (deltaTime / 1000);
    const ratio = Math.min(moveAmount / distance, 1);

    this.position.x += dx * ratio;
    this.position.y += dy * ratio;

    if (Math.abs(dx) > NPC_DIRECTION_CHANGE_THRESHOLD) {
      const newDirection = dx > 0 ? 1 : -1;
      if (newDirection !== this.lastDirection) {
        this.lastDirection = newDirection;
        if ('setFlipX' in this.sprite) {
          this.sprite.setFlipX(newDirection < 0);
        }
      }
    }
  }

  getNeed(type: NeedType): Need | undefined {
    return this.needs.get(type);
  }

  setNeedValue(type: NeedType, value: number): void {
    const need = this.needs.get(type);
    if (need) {
      need.value = Math.max(0, Math.min(NPC_NEED_MAX_VALUE, value));
    }
  }

  setTargetPosition(target: Position | null): void {
    if (!target) {
      this.targetPosition = null;
      this.path = [];
      this.currentWaypoint = null;
      return;
    }

    const start = { x: Math.round(this.position.x), y: Math.round(this.position.y) };
    const end = { x: Math.round(target.x), y: Math.round(target.y) };

    const path = this.worldMap.findPath(start, end);
    if (!path) {
      this.targetPosition = null;
      this.path = [];
      this.currentWaypoint = null;
      return;
    }

    this.targetPosition = target;
    this.path = path;
    this.currentWaypoint = this.path.shift() ?? null;
  }

  getTargetPosition(): Position | null {
    return this.targetPosition;
  }

  setMoveSpeedOverride(value: number | null): void {
    this.moveSpeedOverride = value;
  }

  getUrgentMoveSpeed(): number {
    return this.urgentMoveSpeed;
  }

  getBaseMoveSpeed(): number {
    return this.baseMoveSpeed;
  }

  getWorldMap(): WorldMap {
    return this.worldMap;
  }

  getWorldQuery(): WorldQuery {
    return this.worldQuery;
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  getPerceptionRadius(): number {
    return this.perceptionRadius;
  }

  getCurrentBehaviorName(): string {
    return this.currentBehavior?.getName() ?? 'Idle';
  }

  getAllNeeds(): Map<NeedType, Need> {
    return this.needs;
  }
}
