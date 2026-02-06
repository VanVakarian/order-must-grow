import { Entity } from '../entities/entity';
import { EntityManager } from '../entities/entity-manager';
import { Position, TileData, TileType } from '../types';
import { WorldMap } from './world-map';

export class WorldQuery {
  private worldMap: WorldMap;
  private entityManager: EntityManager;

  constructor(worldMap: WorldMap, entityManager: EntityManager) {
    this.worldMap = worldMap;
    this.entityManager = entityManager;
  }

  findNearestVegetation(position: Position, radius: number): Position | null {
    return this.findNearestTileInRadius(position, radius, (tile) => tile.vegetation !== null);
  }

  findNearestWater(position: Position, radius: number): Position | null {
    return this.findNearestTileInRadius(position, radius, (tile) => tile.type === TileType.WATER);
  }

  findNearestEntity(
    position: Position,
    radius: number,
    predicate: (entity: Entity) => boolean,
  ): Entity | null {
    const entities = this.entityManager.getAllEntities();
    let nearest: Entity | null = null;
    let minDist = Infinity;

    for (const entity of entities) {
      if (!predicate(entity)) continue;
      const entityPos = entity.getPosition();
      const dist = Math.hypot(entityPos.x - position.x, entityPos.y - position.y);
      if (dist <= radius && dist < minDist) {
        minDist = dist;
        nearest = entity;
      }
    }

    return nearest;
  }

  private findNearestTileInRadius(
    position: Position,
    radius: number,
    predicate: (tile: TileData) => boolean,
  ): Position | null {
    const minX = Math.max(0, Math.floor(position.x - radius));
    const maxX = Math.min(this.worldMap.getWidth() - 1, Math.ceil(position.x + radius));
    const minY = Math.max(0, Math.floor(position.y - radius));
    const maxY = Math.min(this.worldMap.getHeight() - 1, Math.ceil(position.y + radius));

    let nearest: Position | null = null;
    let minDist = Infinity;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = this.worldMap.getTile(x, y);
        if (!tile || !predicate(tile)) continue;
        const dist = Math.hypot(x - position.x, y - position.y);
        if (dist <= radius && dist < minDist) {
          minDist = dist;
          nearest = { x, y };
        }
      }
    }

    return nearest;
  }
}
