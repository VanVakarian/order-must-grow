import Phaser from 'phaser';
import { AIBehavior } from '../ai/ai-behavior';
import { EntityType, Need, NeedType, Position } from '../types';
import { WorldMap } from '../world/world-map';
import { Entity } from './entity';

export abstract class NPCEntity extends Entity {
  protected needs: Map<NeedType, Need>;
  protected behaviors: AIBehavior[];
  protected currentBehavior: AIBehavior | null;
  protected worldMap: WorldMap;
  protected targetPosition: Position | null;
  protected moveSpeed: number;

  constructor(scene: Phaser.Scene, type: EntityType, x: number, y: number, worldMap: WorldMap) {
    super(scene, type, x, y);
    this.needs = new Map();
    this.behaviors = [];
    this.currentBehavior = null;
    this.worldMap = worldMap;
    this.targetPosition = null;
    this.moveSpeed = 0.5;
    this.initializeNeeds();
    this.initializeBehaviors();
  }

  protected abstract initializeNeeds(): void;
  protected abstract initializeBehaviors(): void;

  update(deltaTime: number): void {
    this.updateNeeds(deltaTime);
    this.updateAI(deltaTime);
    this.updateMovement(deltaTime);
    this.updateSpritePosition();
    this.updateHighlightFrame();
  }

  protected updateNeeds(deltaTime: number): void {
    for (const need of this.needs.values()) {
      need.value = Math.min(100, need.value + need.changeRate * (deltaTime / 1000));
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
    if (!this.targetPosition) return;

    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.05) {
      this.position.x = this.targetPosition.x;
      this.position.y = this.targetPosition.y;
      this.targetPosition = null;
      return;
    }

    const moveAmount = this.moveSpeed * (deltaTime / 1000);
    const ratio = Math.min(moveAmount / distance, 1);

    this.position.x += dx * ratio;
    this.position.y += dy * ratio;
  }

  protected updateSpritePosition(): void {
    const tileSize = 48;
    this.sprite.setPosition(
      this.position.x * tileSize + tileSize / 2,
      this.position.y * tileSize + tileSize / 2,
    );
  }

  getNeed(type: NeedType): Need | undefined {
    return this.needs.get(type);
  }

  setNeedValue(type: NeedType, value: number): void {
    const need = this.needs.get(type);
    if (need) {
      need.value = Math.max(0, Math.min(100, value));
    }
  }

  setTargetPosition(target: Position | null): void {
    this.targetPosition = target;
  }

  getTargetPosition(): Position | null {
    return this.targetPosition;
  }

  getWorldMap(): WorldMap {
    return this.worldMap;
  }

  getCurrentBehaviorName(): string {
    return this.currentBehavior?.getName() ?? 'Idle';
  }

  getAllNeeds(): Map<NeedType, Need> {
    return this.needs;
  }
}
