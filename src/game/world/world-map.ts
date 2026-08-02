import {
  PATHFINDING_MIN_SEARCH_RADIUS,
  PATHFINDING_SEARCH_RADIUS_MARGIN,
  WATER_ADJACENCY_MAX_DISTANCE,
  WORLD_STONE_NOISE_THRESHOLD,
  WORLD_VEGETATION_INITIAL_GROWTH_STAGE,
  WORLD_VEGETATION_SPAWN_CHANCE,
  WORLD_WATER_NOISE_THRESHOLD,
} from '../const';
import { Position, TileData, TileType, VegetationType } from '../types';

export class WorldMap {
  private readonly tiles: Map<string, TileData> = new Map();
  private readonly seed: number;

  constructor(seed: number = Math.random() * 10000) {
    this.seed = seed;
  }

  getTile(x: number, y: number): TileData {
    const key = `${x},${y}`;
    let tile = this.tiles.get(key);

    if (!tile) {
      tile = this.generateTile(x, y);
      this.tiles.set(key, tile);
    }

    return tile;
  }

  private generateTile(x: number, y: number): TileData {
    const tileType = this.generateTileType(x, y);
    const tile: TileData = { x, y, type: tileType, vegetation: null, everSeen: false };

    if (tileType === TileType.DIRT && Math.random() < WORLD_VEGETATION_SPAWN_CHANCE) {
      tile.vegetation = {
        type: VegetationType.GRASS,
        growthStage: WORLD_VEGETATION_INITIAL_GROWTH_STAGE,
      };
    }

    return tile;
  }

  private generateTileType(x: number, y: number): TileType {
    const noise = this.perlinNoise(x * 0.1, y * 0.1);
    const waterNoise = this.perlinNoise(x * 0.15 + 100, y * 0.15 + 100);

    if (waterNoise > WORLD_WATER_NOISE_THRESHOLD) {
      return TileType.WATER;
    }
    return noise > WORLD_STONE_NOISE_THRESHOLD ? TileType.STONE : TileType.DIRT;
  }

  private perlinNoise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.gradient(xi, yi);
    const ab = this.gradient(xi, yi + 1);
    const ba = this.gradient(xi + 1, yi);
    const bb = this.gradient(xi + 1, yi + 1);

    const x1 = this.lerp(aa, ba, u);
    const x2 = this.lerp(ab, bb, u);

    return this.lerp(x1, x2, v);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private gradient(x: number, y: number): number {
    const hash = Math.sin((x + this.seed) * 12.9898 + (y + this.seed) * 78.233) * 43758.5453;
    return (hash - Math.floor(hash)) * 2 - 1;
  }

  updateTile(x: number, y: number, updates: Partial<TileData>): void {
    Object.assign(this.getTile(x, y), updates);
  }

  removeVegetation(x: number, y: number): void {
    this.getTile(x, y).vegetation = null;
  }

  isWalkable(x: number, y: number): boolean {
    return this.getTile(x, y).type !== TileType.WATER;
  }

  findPath(start: Position, end: Position): Position[] | null {
    const startX = Math.round(start.x);
    const startY = Math.round(start.y);
    const endX = Math.round(end.x);
    const endY = Math.round(end.y);

    if (startX === endX && startY === endY) {
      return [];
    }

    if (!this.isWalkable(endX, endY)) {
      return null;
    }

    const searchRadius = Math.max(
      PATHFINDING_MIN_SEARCH_RADIUS,
      Math.hypot(endX - startX, endY - startY) + PATHFINDING_SEARCH_RADIUS_MARGIN,
    );
    const toKey = (x: number, y: number) => `${x},${y}`;

    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const queue: Position[] = [{ x: startX, y: startY }];
    visited.add(toKey(startX, startY));

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 },
    ];

    let found = false;

    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      if (current.x === endX && current.y === endY) {
        found = true;
        break;
      }

      for (const dir of directions) {
        const nextX = current.x + dir.x;
        const nextY = current.y + dir.y;

        if (Math.abs(nextX - startX) > searchRadius || Math.abs(nextY - startY) > searchRadius) {
          continue;
        }

        if (dir.x !== 0 && dir.y !== 0) {
          if (!this.isWalkable(current.x + dir.x, current.y) || !this.isWalkable(current.x, current.y + dir.y)) {
            continue;
          }
        }

        const nextKey = toKey(nextX, nextY);
        if (visited.has(nextKey)) continue;
        if (!this.isWalkable(nextX, nextY)) continue;

        visited.add(nextKey);
        parent.set(nextKey, toKey(current.x, current.y));
        queue.push({ x: nextX, y: nextY });
      }
    }

    if (!found) {
      return null;
    }

    const path: Position[] = [];
    const startKey = toKey(startX, startY);
    let currentKey = toKey(endX, endY);

    while (currentKey !== startKey) {
      const [x, y] = currentKey.split(',').map(Number);
      path.push({ x, y });
      const prevKey = parent.get(currentKey);
      if (!prevKey) return null;
      currentKey = prevKey;
    }

    path.reverse();
    return path;
  }

  isNextToWater(pos: Position): boolean {
    const centerX = Math.round(pos.x);
    const centerY = Math.round(pos.y);

    const checkPositions = [
      { x: centerX, y: centerY },
      { x: Math.floor(pos.x), y: Math.floor(pos.y) },
      { x: Math.ceil(pos.x), y: Math.floor(pos.y) },
      { x: Math.floor(pos.x), y: Math.ceil(pos.y) },
      { x: Math.ceil(pos.x), y: Math.ceil(pos.y) },
    ];

    for (const checkPos of checkPositions) {
      const directions = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ];

      for (const dir of directions) {
        const checkX = checkPos.x + dir.x;
        const checkY = checkPos.y + dir.y;
        const tile = this.getTile(checkX, checkY);
        if (tile.type === TileType.WATER) {
          const distToWater = Math.hypot(pos.x - checkX, pos.y - checkY);
          if (distToWater <= WATER_ADJACENCY_MAX_DISTANCE) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
