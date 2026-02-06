import { computed, Injectable, signal } from '@angular/core';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';
import { NPCEntity } from '../../game/entities/npc-entity';
import { MainScene } from '../../game/scenes/main-scene';
import { NeedType } from '../../game/types';

export interface RabbitDebugData {
  id: string;
  fullId: string;
  position: { x: number; y: number };
  hunger: number;
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

  getRabbitsDebugData(): RabbitDebugData[] {
    const game = this.game$$();
    if (!game) return [];

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return [];

    const entityManager = scene.getEntityManager();
    if (!entityManager) return [];

    const entities = entityManager.getAllEntities();
    const rabbits = entities.filter((e) => e instanceof NPCEntity) as NPCEntity[];

    return rabbits.map((rabbit) => {
      const hunger = rabbit.getNeed(NeedType.HUNGER);
      const fullId = rabbit.getId();
      return {
        id: fullId.slice(0, 8),
        fullId,
        position: rabbit.getPosition(),
        hunger: hunger ? Math.round(hunger.value) : 0,
        status: rabbit.getCurrentBehaviorName(),
      };
    });
  }

  highlightRabbit(rabbitId: string | null): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    const entityManager = scene.getEntityManager();
    if (!entityManager) return;

    const entities = entityManager.getAllEntities();
    for (const entity of entities) {
      entity.setHighlight(entity.getId() === rabbitId);
    }
  }

  focusOnRabbit(rabbitId: string): void {
    const game = this.game$$();
    if (!game) return;

    const scene = game.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    scene.focusOnEntity(rabbitId);
  }
}
