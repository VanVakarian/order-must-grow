import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import {
  BLOOD_COLOR_HIGH,
  BLOOD_COLOR_LOW,
  BLOOD_COLOR_MEDIUM,
  BLOOD_LEVEL_HIGH_THRESHOLD,
  BLOOD_LEVEL_MEDIUM_THRESHOLD,
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ZOOM,
  DEBUG_UI_POLL_INTERVAL_MS,
  HEALTH_COLOR_CRITICAL,
  HEALTH_COLOR_DESTROYED,
  HEALTH_COLOR_HEALTHY,
  HEALTH_COLOR_INJURED,
  HEALTH_RATIO_HEALTHY_THRESHOLD,
  HEALTH_RATIO_INJURED_THRESHOLD,
  NEED_COLOR_HIGH,
  NEED_COLOR_LOW,
  NEED_COLOR_MEDIUM,
  NEED_LOW_THRESHOLD,
  NEED_MEDIUM_THRESHOLD,
} from '../../../game/const';
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
  protected readonly zoomRange$$ = signal({ min: CAMERA_MIN_ZOOM, max: CAMERA_MAX_ZOOM });

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
    if (value < NEED_LOW_THRESHOLD) return NEED_COLOR_LOW;
    if (value < NEED_MEDIUM_THRESHOLD) return NEED_COLOR_MEDIUM;
    return NEED_COLOR_HIGH;
  }

  protected getPartColor(healthRatio: number, destroyed: boolean): string {
    if (destroyed) return HEALTH_COLOR_DESTROYED;
    if (healthRatio > HEALTH_RATIO_HEALTHY_THRESHOLD) return HEALTH_COLOR_HEALTHY;
    if (healthRatio > HEALTH_RATIO_INJURED_THRESHOLD) return HEALTH_COLOR_INJURED;
    return HEALTH_COLOR_CRITICAL;
  }

  protected getBloodColor(bloodLevel: number): string {
    if (bloodLevel > BLOOD_LEVEL_HIGH_THRESHOLD) return BLOOD_COLOR_HIGH;
    if (bloodLevel > BLOOD_LEVEL_MEDIUM_THRESHOLD) return BLOOD_COLOR_MEDIUM;
    return BLOOD_COLOR_LOW;
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
        }, DEBUG_UI_POLL_INTERVAL_MS);
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
        }, DEBUG_UI_POLL_INTERVAL_MS);
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
        }, DEBUG_UI_POLL_INTERVAL_MS);
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
