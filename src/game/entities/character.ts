import Phaser from 'phaser';
import { CombatComponent, CombatTarget } from '../combat/combat-component';
import { WeaponType } from '../combat/weapon-type';
import { HUMANOID_FRONT_FACING_ANGLE } from '../const';
import { BodyPlan } from '../health/body-part-template';
import { HealthComponent } from '../health/health-component';
import { StatsComponent } from '../stats/stats-component';
import { StatType } from '../stats/stat-type';
import { EntityType } from '../types';
import { Entity } from './entity';

export abstract class Character extends Entity {
  protected readonly stats: StatsComponent;
  protected readonly health: HealthComponent;
  protected readonly combat: CombatComponent;
  protected facingAngle = HUMANOID_FRONT_FACING_ANGLE;
  protected weaponSwayOffsetX = 0;

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
    this.combat = new CombatComponent(scene);
  }

  getStats(): StatsComponent {
    return this.stats;
  }

  getHealth(): HealthComponent {
    return this.health;
  }

  getCombat(): CombatComponent {
    return this.combat;
  }

  getFacingAngle(): number {
    return this.facingAngle;
  }

  override destroy(): void {
    this.combat.destroy();
    super.destroy();
  }

  protected equipWeapon(weaponType: WeaponType): void {
    this.combat.equip(weaponType);
  }

  protected tickHealth(deltaTime: number): void {
    this.health.update(deltaTime);
  }

  protected tickCombat(deltaTime: number): void {
    this.combat.update(deltaTime, this.sprite.x, this.sprite.y, this.facingAngle, this.weaponSwayOffsetX);
  }

  protected tryAttack(target: CombatTarget | null): void {
    this.combat.tryAttack(this.position, target);
  }
}
