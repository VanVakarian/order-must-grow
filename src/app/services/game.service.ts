import { computed, Injectable, signal } from '@angular/core';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';
import { Character } from '../../game/entities/character';
import { NPCEntity } from '../../game/entities/npc-entity';
import { BodyPartType } from '../../game/health/body-part-type';
import { DeathCause } from '../../game/health/health-component';
import { MainScene } from '../../game/scenes/main-scene';
import { StatType } from '../../game/stats/stat-type';
import { NeedType } from '../../game/types';

export interface NpcDebugData {
  id: string;
  fullId: string;
  type: string;
  position: { x: number; y: number };
  hunger: number;
  thirst: number;
  status: string;
}

export interface BodyPartSnapshot {
  type: BodyPartType;
  label: string;
  healthRatio: number;
  destroyed: boolean;
  vital: boolean;
}

export interface CharacterHealthSnapshot {
  isDead: boolean;
  deathCause: DeathCause | null;
  bloodLevel: number;
  bleedRate: number;
  parts: BodyPartSnapshot[];
  moveSpeed: number;
  sightRange: number;
  aimAccuracy: number;
}

export interface InspectorRow {
  label: string;
  value: string;
}

export interface InspectorLogEntry {
  timestamp: number;
  message: string;
}

// "kind" — дискриминант: какой блок рендерить в инспекторе. Новый тип данных для
// будущих сущностей добавляется сюда новым вариантом, без изменения UI-компонента.
export type InspectorSection =
  | { kind: 'rows'; title: string; rows: InspectorRow[] }
  | { kind: 'bodyParts'; title: string; parts: BodyPartSnapshot[] }
  | { kind: 'log'; title: string; entries: InspectorLogEntry[] };

export interface InspectorSnapshot {
  entityId: string;
  displayName: string;
  position: { x: number; y: number };
  sections: InspectorSection[];
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly game$$ = signal<Phaser.Game | null>(null);
  readonly isGameReady$$ = computed(() => this.game$$() !== null);

  initializeGame(parent: string): void {
    const currentGame = this.game$$();
    if (currentGame) {
      currentGame.destroy(true);
    }

    const config = {
      ...gameConfig,
      parent,
    };

    const game = new Phaser.Game(config);
    this.game$$.set(game);
  }

  destroyGame(): void {
    const game = this.game$$();
    if (game) {
      game.destroy(true);
      this.game$$.set(null);
    }
  }

  getNpcsDebugData(): NpcDebugData[] {
    const game = this.game$$();
    if (!game) return [];

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return [];

    const entityManager = scene.getEntityManager();
    if (!entityManager) return [];

    const entities = entityManager.getAllEntities();
    const npcs = entities.filter((e) => e instanceof NPCEntity) as NPCEntity[];

    return npcs.map((npc) => {
      const hunger = npc.getNeed(NeedType.HUNGER);
      const thirst = npc.getNeed(NeedType.THIRST);
      const fullId = npc.getId();
      return {
        id: fullId.slice(0, 8),
        fullId,
        type: npc.getType(),
        position: npc.getPosition(),
        hunger: hunger ? Math.round(hunger.value) : 0,
        thirst: thirst ? Math.round(thirst.value) : 0,
        status: npc.getCurrentBehaviorName(),
      };
    });
  }

  highlightNpc(npcId: string | null): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    scene.setHighlightedEntityId(npcId);
  }

  focusOnNpc(npcId: string): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    scene.focusOnEntity(npcId);
  }

  getPlayerHealthSnapshot(): CharacterHealthSnapshot | null {
    const game = this.game$$();
    if (!game) return null;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return null;

    const player = scene.getPlayer();
    if (!player) return null;

    const health = player.getHealth();
    const stats = player.getStats();

    return {
      isDead: health.isDead(),
      deathCause: health.getDeathCause(),
      bloodLevel: health.getBloodLevel(),
      bleedRate: health.getBleedRate(),
      parts: health.getParts().map((part) => ({
        type: part.type,
        label: part.label,
        healthRatio: part.getHealthRatio(),
        destroyed: part.isDestroyed(),
        vital: part.vital,
      })),
      moveSpeed: stats.getValue(StatType.MOVE_SPEED),
      sightRange: stats.getValue(StatType.SIGHT_RANGE),
      aimAccuracy: stats.getValue(StatType.AIM_ACCURACY),
    };
  }

  debugDamagePlayerPart(bodyPartType: BodyPartType, amount: number): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    scene.getPlayer()?.getHealth().applyDamage(bodyPartType, amount);
  }

  getCameraZoom(): number | null {
    const game = this.game$$();
    if (!game) return null;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return null;

    return scene.getZoom();
  }

  getCameraZoomRange(): { min: number; max: number } | null {
    const game = this.game$$();
    if (!game) return null;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return null;

    return scene.getZoomRange();
  }

  setCameraZoom(value: number): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    scene.setZoom(value);
  }

  getInspectedEntityIds(): string[] {
    const game = this.game$$();
    if (!game) return [];

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return [];

    return scene.getInspectedEntityIds();
  }

  closeInspector(entityId: string): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    scene.removeInspectedEntity(entityId);
  }

  getInspectorSnapshot(entityId: string): InspectorSnapshot | null {
    const game = this.game$$();
    if (!game) return null;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return null;

    const entity = scene
      .getEntityManager()
      .getAllEntities()
      .find((e) => e.getId() === entityId);
    if (!entity) return null;

    const displayName = `${entity.getType()} #${entityId.slice(0, 8)}`;
    const position = entity.getPosition();
    const sections: InspectorSection[] = [];

    if (entity instanceof Character) {
      const health = entity.getHealth();
      const stats = entity.getStats();

      const rows: InspectorRow[] = [
        { label: 'Move speed', value: stats.getValue(StatType.MOVE_SPEED).toFixed(1) },
        { label: 'Sight range', value: stats.getValue(StatType.SIGHT_RANGE).toFixed(0) },
        { label: 'Aim accuracy', value: stats.getValue(StatType.AIM_ACCURACY).toFixed(2) },
        { label: 'Blood', value: `${health.getBloodLevel().toFixed(0)}%` },
      ];
      if (health.getBleedRate() > 0) {
        rows.push({ label: 'Bleeding', value: `${health.getBleedRate().toFixed(1)}/s` });
      }
      if (health.isDead()) {
        rows.push({ label: 'Status', value: `DEAD — ${health.getDeathCause()}` });
      }

      sections.push({ kind: 'rows', title: 'Stats', rows });
      sections.push({
        kind: 'bodyParts',
        title: 'Body parts',
        parts: health.getParts().map((part) => ({
          type: part.type,
          label: part.label,
          healthRatio: part.getHealthRatio(),
          destroyed: part.isDestroyed(),
          vital: part.vital,
        })),
      });
      sections.push({ kind: 'log', title: 'Event log', entries: [] });
    } else if (entity instanceof NPCEntity) {
      const hunger = entity.getNeed(NeedType.HUNGER);
      const thirst = entity.getNeed(NeedType.THIRST);

      sections.push({
        kind: 'rows',
        title: 'Status',
        rows: [
          { label: 'Behavior', value: entity.getCurrentBehaviorName() },
          { label: 'Hunger', value: hunger ? `${Math.round(hunger.value)}%` : '—' },
          { label: 'Thirst', value: thirst ? `${Math.round(thirst.value)}%` : '—' },
        ],
      });
      sections.push({ kind: 'log', title: 'Event log', entries: [] });
    }

    return { entityId, displayName, position, sections };
  }
}
