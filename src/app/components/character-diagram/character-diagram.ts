import { DecimalPipe } from '@angular/common';
import { Component, HostListener, computed, effect, inject, signal, untracked } from '@angular/core';
import { BodyPartType } from '../../../game/health/body-part-type';
import { CharacterHealthSnapshot, GameService } from '../../services/game.service';

interface RectShape {
  type: BodyPartType;
  shape: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

interface EllipseShape {
  type: BodyPartType;
  shape: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

type PartShape = RectShape | EllipseShape;

const BODY_SHAPES: PartShape[] = [
  { type: BodyPartType.LEFT_LEG, shape: 'rect', x: 62, y: 210, width: 34, height: 130, rx: 10 },
  { type: BodyPartType.RIGHT_LEG, shape: 'rect', x: 104, y: 210, width: 34, height: 130, rx: 10 },
  { type: BodyPartType.LEFT_ARM, shape: 'rect', x: 25, y: 95, width: 28, height: 115, rx: 12 },
  { type: BodyPartType.RIGHT_ARM, shape: 'rect', x: 147, y: 95, width: 28, height: 115, rx: 12 },
  { type: BodyPartType.TORSO, shape: 'rect', x: 60, y: 90, width: 80, height: 120, rx: 10 },
  { type: BodyPartType.NECK, shape: 'rect', x: 88, y: 70, width: 24, height: 20, rx: 4 },
  { type: BodyPartType.HEAD, shape: 'ellipse', cx: 100, cy: 45, rx: 28, ry: 28 },
  { type: BodyPartType.BRAIN, shape: 'ellipse', cx: 100, cy: 38, rx: 16, ry: 11 },
  { type: BodyPartType.HEART, shape: 'ellipse', cx: 85, cy: 130, rx: 11, ry: 13 },
  { type: BodyPartType.LEFT_EYE, shape: 'ellipse', cx: 88, cy: 42, rx: 4, ry: 4 },
  { type: BodyPartType.RIGHT_EYE, shape: 'ellipse', cx: 112, cy: 42, rx: 4, ry: 4 },
];

@Component({
  selector: 'character-diagram',
  templateUrl: './character-diagram.html',
  styleUrl: './character-diagram.scss',
  imports: [DecimalPipe],
})
export class CharacterDiagram {
  protected readonly shapes = BODY_SHAPES;
  protected readonly isOpen$$ = signal(false);
  protected readonly hoveredType$$ = signal<BodyPartType | null>(null);
  protected readonly snapshot$$ = signal<CharacterHealthSnapshot | null>(null);

  protected readonly partsByType = computed(() => {
    const snapshot = this.snapshot$$();
    return new Map((snapshot?.parts ?? []).map((part) => [part.type, part]));
  });

  protected readonly hoveredPart = computed(() => {
    const type = this.hoveredType$$();
    return type ? (this.partsByType().get(type) ?? null) : null;
  });

  private readonly gameService = inject(GameService);

  public constructor() {
    let intervalId: number | undefined;

    effect((onCleanup) => {
      const shouldPoll = this.isOpen$$() && this.gameService.isGameReady$$();

      if (shouldPoll) {
        intervalId = window.setInterval(() => {
          untracked(() => {
            this.snapshot$$.set(this.gameService.getPlayerHealthSnapshot());
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

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.code === 'KeyC') {
      this.toggle();
    } else if (event.code === 'Escape' && this.isOpen$$()) {
      this.close();
    }
  }

  protected toggle(): void {
    this.isOpen$$.update((value) => !value);
  }

  protected close(): void {
    this.isOpen$$.set(false);
  }

  protected onHover(type: BodyPartType): void {
    this.hoveredType$$.set(type);
  }

  protected onLeaveHover(): void {
    this.hoveredType$$.set(null);
  }

  protected getShapeColor(type: BodyPartType): string {
    const part = this.partsByType().get(type);
    if (!part) return '#6b7280';
    return this.getPartColor(part.healthRatio, part.destroyed);
  }

  protected getPartColor(healthRatio: number, destroyed: boolean): string {
    if (destroyed) return '#4b5563';
    if (healthRatio > 0.66) return '#4ade80';
    if (healthRatio > 0.33) return '#fbbf24';
    return '#ef4444';
  }
}
