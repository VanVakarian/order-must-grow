import { StatType } from './stat-type';

export enum StatModifierMode {
  FLAT = 'FLAT',
  MULTIPLIER = 'MULTIPLIER',
}

export interface StatModifier {
  sourceId: string;
  statType: StatType;
  mode: StatModifierMode;
  value: number;
}
