import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { BodyPartType } from '../../../game/health/body-part-type';
import { CharacterHealthSnapshot, GameService, NpcDebugData } from '../../services/game.service';

export const PanelSection = {
  Npcs: 'npcs',
  Character: 'character',
  Settings: 'settings',
} as const;

export type PanelSection = (typeof PanelSection)[keyof typeof PanelSection];

@Component({
  selector: 'debug-panel',
  imports: [DecimalPipe],
  templateUrl: './debug-panel.html',
  styleUrl: './debug-panel.scss',
})
export class DebugPanel {
  protected readonly PanelSection = PanelSection;

  protected readonly openSection$$ = signal<PanelSection | null>(null);

  protected readonly npcs$$ = signal<NpcDebugData[]>([]);
  protected readonly snapshot$$ = signal<CharacterHealthSnapshot | null>(null);
  protected readonly zoomValue$$ = signal(1);
  protected readonly zoomRange$$ = signal({ min: 0.5, max: 4 });

  private readonly gameService = inject(GameService);

  public constructor() {
    this.setupNpcPolling();
    this.setupCharacterPolling();
    this.setupZoomPolling();
  }

  protected toggleSection(section: PanelSection): void {
    this.openSection$$.update((current) => (current === section ? null : section));
  }

  protected onNpcHover(npc: NpcDebugData): void {
    this.gameService.highlightNpc(npc.fullId);
  }

  protected onNpcLeave(): void {
    this.gameService.highlightNpc(null);
  }

  protected onNpcClick(npc: NpcDebugData): void {
    this.gameService.focusOnNpc(npc.fullId);
  }

  protected getNeedColor(value: number): string {
    if (value < 30) return '#4ade80';
    if (value < 60) return '#fbbf24';
    return '#ef4444';
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

  protected onZoomChange(value: string): void {
    const numericValue = Number(value);
    this.zoomValue$$.set(numericValue);
    this.gameService.setCameraZoom(numericValue);
  }

  private setupNpcPolling(): void {
    let intervalId: number | undefined;

    effect((onCleanup) => {
      const shouldPoll =
        this.openSection$$() === PanelSection.Npcs && this.gameService.isGameReady$$();

      if (shouldPoll) {
        intervalId = window.setInterval(() => {
          untracked(() => {
            this.npcs$$.set(this.gameService.getNpcsDebugData());
          });
        }, 100);
      } else if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }

      onCleanup(() => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      });
    });
  }

  private setupCharacterPolling(): void {
    let intervalId: number | undefined;

    effect((onCleanup) => {
      const shouldPoll =
        this.openSection$$() === PanelSection.Character && this.gameService.isGameReady$$();

      if (shouldPoll) {
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

  private setupZoomPolling(): void {
    let intervalId: number | undefined;

    effect((onCleanup) => {
      const shouldPoll =
        this.openSection$$() === PanelSection.Settings && this.gameService.isGameReady$$();

      if (shouldPoll) {
        untracked(() => {
          const range = this.gameService.getCameraZoomRange();
          if (range) this.zoomRange$$.set(range);
        });

        intervalId = window.setInterval(() => {
          untracked(() => {
            const zoom = this.gameService.getCameraZoom();
            if (zoom !== null) this.zoomValue$$.set(zoom);
          });
        }, 100);
      } else if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }

      onCleanup(() => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      });
    });
  }
}
