import { BodyPartTemplate } from './body-part-template';
import { BodyPartType } from './body-part-type';

export class BodyPart {
  readonly type: BodyPartType;
  readonly label: string;
  readonly parentType: BodyPartType | null;
  readonly maxHealth: number;
  readonly vital: boolean;
  readonly bleedRateMultiplier: number;
  readonly hitChanceWeight: number;

  private health: number;
  private destroyed = false;

  constructor(template: BodyPartTemplate) {
    this.type = template.type;
    this.label = template.label;
    this.parentType = template.parent;
    this.maxHealth = template.maxHealth;
    this.vital = template.vital;
    this.bleedRateMultiplier = template.bleedRateMultiplier;
    this.hitChanceWeight = template.hitChanceWeight;
    this.health = template.maxHealth;
  }

  applyDamage(amount: number): void {
    if (this.destroyed || amount <= 0) return;

    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.destroyed = true;
    }
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  getHealth(): number {
    return this.health;
  }

  getMissingHealth(): number {
    return this.maxHealth - this.health;
  }

  getHealthRatio(): number {
    return this.health / this.maxHealth;
  }
}

export function pickRandomBodyPart(parts: BodyPart[]): BodyPartType {
  const totalWeight = parts.reduce((sum, part) => sum + part.hitChanceWeight, 0);
  let roll = Math.random() * totalWeight;

  for (const part of parts) {
    roll -= part.hitChanceWeight;
    if (roll <= 0) return part.type;
  }

  return parts[parts.length - 1].type;
}
