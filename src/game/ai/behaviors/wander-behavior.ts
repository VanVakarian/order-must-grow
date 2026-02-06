import { NPCEntity } from '../../entities/npc-entity';
import { BehaviorPriority } from '../../types';
import { AIBehavior } from '../ai-behavior';

export class WanderBehavior extends AIBehavior {
  private wanderTimer: number = 0;
  private wanderInterval: number = 2000;

  constructor() {
    super(BehaviorPriority.LOW, 'Wandering');
  }

  shouldExecute(_npc: NPCEntity): boolean {
    return true;
  }

  execute(npc: NPCEntity, deltaTime: number): void {
    const currentTarget = npc.getTargetPosition();

    if (currentTarget) {
      const pos = npc.getPosition();
      const distance = Math.hypot(currentTarget.x - pos.x, currentTarget.y - pos.y);

      if (distance < 0.1) {
        npc.setTargetPosition(null);
        this.wanderTimer = 0;
      }
      return;
    }

    this.wanderTimer += deltaTime;

    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.setRandomTarget(npc);
    }
  }

  private setRandomTarget(npc: NPCEntity): void {
    const worldMap = npc.getWorldMap();
    const currentPos = npc.getPosition();

    const maxDistance = 3;
    const attempts = 10;

    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * maxDistance + 1;

      const targetX = Math.floor(currentPos.x + Math.cos(angle) * distance);
      const targetY = Math.floor(currentPos.y + Math.sin(angle) * distance);

      if (worldMap.isWalkable(targetX, targetY)) {
        npc.setTargetPosition({ x: targetX, y: targetY });
        return;
      }
    }
  }
}
