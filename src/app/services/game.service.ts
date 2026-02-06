import { computed, Injectable, signal } from '@angular/core';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';
import { NPCEntity } from '../../game/entities/npc-entity';
import { MainScene } from '../../game/scenes/main-scene';
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
}
