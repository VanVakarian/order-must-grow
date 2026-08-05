import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import {
  DEBUG_UI_POLL_INTERVAL_MS,
  HEALTH_COLOR_CRITICAL,
  HEALTH_COLOR_DESTROYED,
  HEALTH_COLOR_HEALTHY,
  HEALTH_COLOR_INJURED,
  HEALTH_RATIO_HEALTHY_THRESHOLD,
  HEALTH_RATIO_INJURED_THRESHOLD,
} from '../../../game/const';
import { GameService, InspectorSnapshot } from '../../services/game.service';

@Component({
  selector: 'entity-inspector-stack',
  imports: [DecimalPipe],
  templateUrl: './entity-inspector-stack.html',
  styleUrl: './entity-inspector-stack.scss',
})
export class EntityInspectorStack {
  protected readonly snapshots$$ = signal<InspectorSnapshot[]>([]);

  private readonly gameService = inject(GameService);

  public constructor() {
    this.setupPolling();
  }

  protected close(entityId: string): void {
    this.gameService.closeInspector(entityId);
  }

  protected getPartColor(healthRatio: number, destroyed: boolean): string {
    if (destroyed) return HEALTH_COLOR_DESTROYED;
    if (healthRatio > HEALTH_RATIO_HEALTHY_THRESHOLD) return HEALTH_COLOR_HEALTHY;
    if (healthRatio > HEALTH_RATIO_INJURED_THRESHOLD) return HEALTH_COLOR_INJURED;
    return HEALTH_COLOR_CRITICAL;
  }

  private setupPolling(): void {
    effect((onCleanup) => {
      const ready = this.gameService.isGameReady$$();
      let intervalId: number | undefined;

      if (ready) {
        intervalId = window.setInterval(() => {
          untracked(() => {
            const ids = this.gameService.getInspectedEntityIds();
            const snapshots = ids
              .map((id) => this.gameService.getInspectorSnapshot(id))
              .filter((snapshot): snapshot is InspectorSnapshot => snapshot !== null);
            this.snapshots$$.set(snapshots);
          });
        }, DEBUG_UI_POLL_INTERVAL_MS);
      } else {
        this.snapshots$$.set([]);
      }

      onCleanup(() => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      });
    });
  }
}
