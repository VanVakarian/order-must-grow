export enum TileType {
  STONE = 'STONE',
  DIRT = 'DIRT',
  WATER = 'WATER',
}

export enum VegetationType {
  GRASS = 'GRASS',
}

export interface VegetationData {
  type: VegetationType;
  growthStage: number;
}

export interface TileData {
  x: number;
  y: number;
  type: TileType;
  vegetation: VegetationData | null;
}

export enum EntityType {
  RABBIT = 'RABBIT',
}

export enum NeedType {
  HUNGER = 'HUNGER',
  THIRST = 'THIRST',
}

export interface Need {
  type: NeedType;
  value: number;
  threshold: number;
  changeRate: number;
}

export enum BehaviorPriority {
  HIGH = 100,
  MEDIUM = 50,
  LOW = 10,
}

export interface Position {
  x: number;
  y: number;
}
