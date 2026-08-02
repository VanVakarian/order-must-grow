import Phaser from 'phaser';
import {
  HIGHLIGHT_FRAME_COLOR,
  HIGHLIGHT_FRAME_CORNER_LENGTH,
  HIGHLIGHT_FRAME_CORNER_RADIUS,
  HIGHLIGHT_FRAME_LINE_WIDTH,
  HIGHLIGHT_FRAME_PADDING,
  RENDER_DEPTH_HIGHLIGHT_FRAME,
} from '../const';
import { EntityType, Position } from '../types';

export abstract class Entity {
  protected id: string;
  protected type: EntityType;
  protected position: Position;
  protected sprite:
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite;
  protected scene: Phaser.Scene;
  protected highlightFrame: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, type: EntityType, x: number, y: number) {
    this.id = this.generateId();
    this.scene = scene;
    this.type = type;
    this.position = { x, y };
    this.sprite = this.createSprite();
    this.highlightFrame = this.createHighlightFrame();
  }

  protected abstract createSprite():
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite;

  abstract update(deltaTime: number): void;

  private createHighlightFrame(): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(RENDER_DEPTH_HIGHLIGHT_FRAME);
    graphics.setVisible(false);
    return graphics;
  }

  protected updateHighlightFrame(): void {
    if (!this.highlightFrame.visible) return;

    const spriteX = this.sprite.x;
    const spriteY = this.sprite.y;
    const spriteWidth = this.sprite.width;
    const spriteHeight = this.sprite.height;

    this.highlightFrame.clear();
    this.highlightFrame.lineStyle(HIGHLIGHT_FRAME_LINE_WIDTH, HIGHLIGHT_FRAME_COLOR, 1);

    const padding = HIGHLIGHT_FRAME_PADDING;
    const cornerLength = HIGHLIGHT_FRAME_CORNER_LENGTH;
    const radius = HIGHLIGHT_FRAME_CORNER_RADIUS;

    const left = spriteX - spriteWidth / 2 - padding;
    const right = spriteX + spriteWidth / 2 + padding;
    const top = spriteY - spriteHeight / 2 - padding;
    const bottom = spriteY + spriteHeight / 2 + padding;

    this.highlightFrame.beginPath();
    this.highlightFrame.moveTo(left, top + cornerLength);
    this.highlightFrame.lineTo(left, top + radius);
    this.highlightFrame.arc(left + radius, top + radius, radius, Math.PI, Math.PI * 1.5);
    this.highlightFrame.lineTo(left + cornerLength, top);
    this.highlightFrame.strokePath();

    this.highlightFrame.beginPath();
    this.highlightFrame.moveTo(right - cornerLength, top);
    this.highlightFrame.lineTo(right - radius, top);
    this.highlightFrame.arc(right - radius, top + radius, radius, Math.PI * 1.5, Math.PI * 2);
    this.highlightFrame.lineTo(right, top + cornerLength);
    this.highlightFrame.strokePath();

    this.highlightFrame.beginPath();
    this.highlightFrame.moveTo(left, bottom - cornerLength);
    this.highlightFrame.lineTo(left, bottom - radius);
    this.highlightFrame.arc(left + radius, bottom - radius, radius, Math.PI, Math.PI * 0.5, true);
    this.highlightFrame.lineTo(left + cornerLength, bottom);
    this.highlightFrame.strokePath();

    this.highlightFrame.beginPath();
    this.highlightFrame.moveTo(right - cornerLength, bottom);
    this.highlightFrame.lineTo(right - radius, bottom);
    this.highlightFrame.arc(right - radius, bottom - radius, radius, Math.PI * 0.5, 0, true);
    this.highlightFrame.lineTo(right, bottom - cornerLength);
    this.highlightFrame.strokePath();
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getId(): string {
    return this.id;
  }

  getType(): EntityType {
    return this.type;
  }

  getPosition(): Position {
    return { ...this.position };
  }

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  getSprite(): Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  setHighlight(highlighted: boolean): void {
    this.highlightFrame.setVisible(highlighted);
    if (highlighted) {
      this.updateHighlightFrame();
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.highlightFrame.destroy();
  }
}
