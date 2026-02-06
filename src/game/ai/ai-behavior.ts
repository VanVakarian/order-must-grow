import { NPCEntity } from '../entities/npc-entity';

export abstract class AIBehavior {
  protected priority: number;
  protected name: string;

  constructor(priority: number, name: string) {
    this.priority = priority;
    this.name = name;
  }

  abstract shouldExecute(npc: NPCEntity): boolean;
  abstract execute(npc: NPCEntity, deltaTime: number): void;

  onEnter?(npc: NPCEntity): void;
  onExit?(npc: NPCEntity): void;

  getPriority(): number {
    return this.priority;
  }

  getName(): string {
    return this.name;
  }
}
