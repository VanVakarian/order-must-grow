import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { BodyPartType } from '../../../game/health/body-part-type';
import { CharacterHealthSnapshot, GameService } from '../../services/game.service';

@Component({
  selector: 'character-panel',
  templateUrl: './character-panel.html',
  styleUrl: './character-panel.scss',
  imports: [DecimalPipe],
})
export class CharacterPanel {
  private readonly gameService = inject(GameService);

  protected readonly isExpanded$$ = signal(true);
  protected readonly snapshot$$ = signal<CharacterHealthSnapshot | null>(null);

  constructor() {
    let intervalId: number | undefined;

    effect((onCleanup) => {
      const isGameReady = this.gameService.isGameReady$$();

      if (isGameReady) {
        intervalId = window.setInterval(() => {
          untracked(() => {
            this.snapshot$$.set(this.gameService.getPlayerHealthSnapshot());
          });
        }, 100);
      } else {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
        this.snapshot$$.set(null);
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

  protected getPartColor(healthRatio: number, destroyed: boolean): string {
    if (destroyed) return '#4b5563';
    if (healthRatio > 0.66) return '#4ade80';
    if (healthRatio > 0.33) return '#fbbf24';
    return '#ef4444';
  }

  protected getBloodColor(bloodLevel: number): string {
    if (bloodLevel > 60) return '#ef4444';
    if (bloodLevel > 30) return '#fbbf24';
    return '#f87171';
  }

  protected damagePart(bodyPartType: BodyPartType, amount: number): void {
    this.gameService.debugDamagePlayerPart(bodyPartType, amount);
  }
}
