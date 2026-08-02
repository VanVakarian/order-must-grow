import { StatModifier, StatModifierMode } from './stat-modifier';
import { StatType } from './stat-type';

export class StatsComponent {
  private readonly base: Map<StatType, number>;
  private modifiers: StatModifier[] = [];

  constructor(base: Partial<Record<StatType, number>>) {
    this.base = new Map(Object.entries(base) as [StatType, number][]);
  }

  getValue(statType: StatType): number {
    const base = this.base.get(statType) ?? 0;

    const flatSum = this.modifiers
      .filter((modifier) => modifier.statType === statType && modifier.mode === StatModifierMode.FLAT)
      .reduce((sum, modifier) => sum + modifier.value, 0);

    const multiplier = this.modifiers
      .filter(
        (modifier) => modifier.statType === statType && modifier.mode === StatModifierMode.MULTIPLIER,
      )
      .reduce((product, modifier) => product * modifier.value, 1);

    return (base + flatSum) * multiplier;
  }

  setModifiersFromSource(sourceId: string, modifiers: StatModifier[]): void {
    this.removeModifiersBySource(sourceId);
    this.modifiers.push(...modifiers);
  }

  removeModifiersBySource(sourceId: string): void {
    this.modifiers = this.modifiers.filter((modifier) => modifier.sourceId !== sourceId);
  }

  getModifiers(): StatModifier[] {
    return [...this.modifiers];
  }
}
