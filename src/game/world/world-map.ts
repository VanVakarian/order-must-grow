import { Position, TileData, TileType, VegetationType } from '../types';

export class WorldMap {
  private tiles: TileData[][];
  private width: number;
  private height: number;
  private seed: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.seed = Math.random() * 10000;
    this.generateWorld();
  }

  private generateWorld(): void {
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const tileType = this.generateTileType(x, y);
        const tile: TileData = {
          x,
          y,
          type: tileType,
          vegetation: null,
        };

        if (tileType === TileType.DIRT && Math.random() < 0.3) {
          tile.vegetation = {
            type: VegetationType.GRASS,
            growthStage: 1,
          };
        }

        this.tiles[y][x] = tile;
      }
    }
  }

  private generateTileType(x: number, y: number): TileType {
    const noise = this.perlinNoise(x * 0.1, y * 0.1);
    const waterNoise = this.perlinNoise(x * 0.15 + 100, y * 0.15 + 100);

    if (waterNoise > 0.5) {
      return TileType.WATER;
    }
    return noise > 0.3 ? TileType.STONE : TileType.DIRT;
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

  getTile(x: number, y: number): TileData | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[y][x];
  }

  updateTile(x: number, y: number, updates: Partial<TileData>): void {
    const tile = this.getTile(x, y);
    if (tile) {
      Object.assign(tile, updates);
    }
  }

  removeVegetation(x: number, y: number): void {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.vegetation = null;
    }
  }

  findNearestVegetation(pos: Position): Position | null {
    let nearest: Position | null = null;
    let minDist = Infinity;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.vegetation) {
          const dist = Math.hypot(x - pos.x, y - pos.y);
          if (dist < minDist) {
            minDist = dist;
            nearest = { x, y };
          }
        }
      }
    }

    return nearest;
  }

  findNearestWater(pos: Position): Position | null {
    let nearest: Position | null = null;
    let minDist = Infinity;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.type === TileType.WATER) {
          const dist = Math.hypot(x - pos.x, y - pos.y);
          if (dist < minDist) {
            minDist = dist;
            nearest = { x, y };
          }
        }
      }
    }

    return nearest;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== null && tile.type !== TileType.WATER;
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
        if (tile && tile.type === TileType.WATER) {
          const distToWater = Math.hypot(pos.x - checkX, pos.y - checkY);
          if (distToWater <= 1.2) {
            return true;
          }
        }
      }
    }

    return false;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getAllTiles(): TileData[][] {
    return this.tiles;
  }
}
