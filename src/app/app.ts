import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DebugPanel } from './components/debug-panel/debug-panel';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DebugPanel],
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
