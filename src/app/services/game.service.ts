import { Injectable, signal } from '@angular/core';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private game: Phaser.Game | null = null;
  public isGameReady = signal(false);

  initializeGame(parent: string): void {
    if (this.game) {
      this.game.destroy(true);
    }

    const config = {
      ...gameConfig,
      parent,
    };

    this.game = new Phaser.Game(config);
    this.isGameReady.set(true);
  }

  destroyGame(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.isGameReady.set(false);
    }
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }
}
