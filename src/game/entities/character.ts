import Phaser from 'phaser';
import { BodyPlan } from '../health/body-part-template';
import { HealthComponent } from '../health/health-component';
import { StatsComponent } from '../stats/stats-component';
import { StatType } from '../stats/stat-type';
import { EntityType } from '../types';
import { Entity } from './entity';

export abstract class Character extends Entity {
  protected readonly stats: StatsComponent;
  protected readonly health: HealthComponent;

  constructor(
    scene: Phaser.Scene,
    type: EntityType,
    x: number,
    y: number,
    baseStats: Partial<Record<StatType, number>>,
    bodyPlan: BodyPlan,
  ) {
    super(scene, type, x, y);
    this.stats = new StatsComponent(baseStats);
    this.health = new HealthComponent(bodyPlan, this.stats);
  }

  getStats(): StatsComponent {
    return this.stats;
  }

  getHealth(): HealthComponent {
    return this.health;
  }

  protected tickHealth(deltaTime: number): void {
    this.health.update(deltaTime);
  }
}
