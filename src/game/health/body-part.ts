import { BodyPartTemplate } from './body-part-template';
import { BodyPartType } from './body-part-type';

export class BodyPart {
  readonly type: BodyPartType;
  readonly label: string;
  readonly parentType: BodyPartType | null;
  readonly maxHealth: number;
  readonly vital: boolean;
  readonly bleedRateMultiplier: number;

  private health: number;
  private destroyed = false;

  constructor(template: BodyPartTemplate) {
    this.type = template.type;
    this.label = template.label;
    this.parentType = template.parent;
    this.maxHealth = template.maxHealth;
    this.vital = template.vital;
    this.bleedRateMultiplier = template.bleedRateMultiplier;
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
