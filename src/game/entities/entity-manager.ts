import { Entity } from './entity';

export class EntityManager {
  private entities: Map<string, Entity>;

  constructor() {
    this.entities = new Map();
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.getId(), entity);
  }

  removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.destroy();
      this.entities.delete(id);
    }
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  update(deltaTime: number): void {
    for (const entity of this.entities.values()) {
      entity.update(deltaTime);
    }
  }

  clear(): void {
    for (const entity of this.entities.values()) {
      entity.destroy();
    }
    this.entities.clear();
  }
}
