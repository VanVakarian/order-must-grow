import { BodyPartType } from './body-part-type';

export interface BodyPartTemplate {
  type: BodyPartType;
  label: string;
  parent: BodyPartType | null;
  maxHealth: number;
  vital: boolean;
  bleedRateMultiplier: number;
}

export type BodyPlan = BodyPartTemplate[];
