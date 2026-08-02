import { HEALTH_INITIAL_BLOOD_LEVEL } from '../const';
import { StatsComponent } from '../stats/stats-component';
import { BodyPart } from './body-part';
import { BodyPartType } from './body-part-type';
import { BodyPlan } from './body-part-template';
import { computeInjuryModifiers, INJURY_MODIFIER_SOURCE } from './injury-effect-rules';

export enum DeathCause {
  VITAL_ORGAN_DESTROYED = 'VITAL_ORGAN_DESTROYED',
  BLOOD_LOSS = 'BLOOD_LOSS',
}

export class HealthComponent {
  private readonly parts: Map<BodyPartType, BodyPart>;
  private readonly stats: StatsComponent;

  private bloodLevel = HEALTH_INITIAL_BLOOD_LEVEL;
  private dead = false;
  private deathCause: DeathCause | null = null;

  constructor(bodyPlan: BodyPlan, stats: StatsComponent) {
    this.parts = new Map(bodyPlan.map((template) => [template.type, new BodyPart(template)]));
    this.stats = stats;
  }

  applyDamage(bodyPartType: BodyPartType, amount: number): void {
    if (this.dead) return;

    const part = this.parts.get(bodyPartType);
    if (!part) return;

    part.applyDamage(amount);

    if (part.isDestroyed() && part.vital) {
      this.die(DeathCause.VITAL_ORGAN_DESTROYED);
      return;
    }

    this.recomputeInjuryModifiers();
  }

  update(deltaTime: number): void {
    if (this.dead) return;

    const bleedRate = this.getBleedRate();
    if (bleedRate <= 0) return;

    this.bloodLevel = Math.max(0, this.bloodLevel - bleedRate * (deltaTime / 1000));
    if (this.bloodLevel === 0) {
      this.die(DeathCause.BLOOD_LOSS);
    }
  }

  getBleedRate(): number {
    let total = 0;
    for (const part of this.parts.values()) {
      total += part.bleedRateMultiplier * part.getMissingHealth();
    }
    return total;
  }

  getBloodLevel(): number {
    return this.bloodLevel;
  }

  isDead(): boolean {
    return this.dead;
  }

  getDeathCause(): DeathCause | null {
    return this.deathCause;
  }

  getPart(type: BodyPartType): BodyPart | undefined {
    return this.parts.get(type);
  }

  getParts(): BodyPart[] {
    return Array.from(this.parts.values());
  }

  private recomputeInjuryModifiers(): void {
    this.stats.setModifiersFromSource(INJURY_MODIFIER_SOURCE, computeInjuryModifiers(this.parts));
  }

  private die(cause: DeathCause): void {
    this.dead = true;
    this.deathCause = cause;
  }
}
