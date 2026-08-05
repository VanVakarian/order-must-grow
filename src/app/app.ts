import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CharacterDiagram } from './components/character-diagram/character-diagram';
import { DebugPanel } from './components/debug-panel/debug-panel';
import { EntityInspectorStack } from './components/entity-inspector-stack/entity-inspector-stack';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DebugPanel, CharacterDiagram, EntityInspectorStack],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly gameService = inject(GameService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.gameService.initializeGame('game-container');
    });

    this.destroyRef.onDestroy(() => {
      this.gameService.destroyGame();
    });
  }
}
