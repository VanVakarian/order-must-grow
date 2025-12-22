import { Component, OnDestroy, OnInit, afterNextRender, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('megagame');

  constructor(private gameService: GameService) {
    afterNextRender(() => {
      this.gameService.initializeGame('game-container');
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.gameService.destroyGame();
  }
}
