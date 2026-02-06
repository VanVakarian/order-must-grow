import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { GameService, RabbitDebugData } from '../../services/game.service';

@Component({
  selector: 'debug-panel',
  imports: [DecimalPipe],
  templateUrl: './debug-panel.html',
  styleUrl: './debug-panel.scss',
})
export class DebugPanel {
  private readonly gameService = inject(GameService);

  protected readonly isExpanded$$ = signal(true);
  protected readonly rabbits$$ = signal<RabbitDebugData[]>([]);

  constructor() {
    let intervalId: number | undefined;

    effect((onCleanup) => {
      const isGameReady = this.gameService.isGameReady$$();

      if (isGameReady) {
        intervalId = window.setInterval(() => {
          untracked(() => {
            const data = this.gameService.getRabbitsDebugData();
            this.rabbits$$.set(data);
          });
        }, 100);
      } else {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
        this.rabbits$$.set([]);
      }

      onCleanup(() => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      });
    });
  }

  protected togglePanel(): void {
    this.isExpanded$$.update((value) => !value);
  }

  protected getHungerColor(hunger: number): string {
    return this.getNeedColor(hunger);
  }

  protected getHungerLabel(hunger: number): string {
    return this.getNeedLabel(hunger);
  }

  protected getNeedColor(value: number): string {
    if (value < 30) return '#4ade80';
    if (value < 60) return '#fbbf24';
    return '#ef4444';
  }

  protected getNeedLabel(value: number): string {
    if (value < 30) return 'Satisfied';
    if (value < 60) return 'Hungry';
    return 'Starving';
  }

  protected onRabbitHover(rabbit: RabbitDebugData): void {
    this.gameService.highlightRabbit(rabbit.fullId);
  }

  protected onRabbitLeave(): void {
    this.gameService.highlightRabbit(null);
  }

  protected onRabbitClick(rabbit: RabbitDebugData): void {
    this.gameService.focusOnRabbit(rabbit.fullId);
  }
}
