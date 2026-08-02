import Phaser from 'phaser';
import { EntityManager } from '../entities/entity-manager';
import { Player } from '../entities/player';
import { generateHumanoidTextures, HumanoidBodyType } from '../rendering/humanoid-sprite-generator';
import { StatType } from '../stats/stat-type';
import { TileType } from '../types';
import { WorldMap } from '../world/world-map';

enum TextureKey {
  TILE_STONE = 'tile-stone',
  TILE_DIRT = 'tile-dirt',
  TILE_GRASS = 'tile-grass',
  TILE_WATER = 'tile-water',
  SELECTION_MARKER = 'selection-marker',
  TILE_FOG = 'tile-fog',
  RABBIT = 'rabbit',
  WOLF = 'wolf',
}

export class MainScene extends Phaser.Scene {
  private tileSize = 48;
  private mapWidthInTiles = 50;
  private mapHeightInTiles = 50;

  private worldMap!: WorldMap;
  private entityManager!: EntityManager;
  private tileSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private tileFogSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private tileFogAmount: Map<string, number> = new Map();
  private player!: Player;

  private minZoom = 0.5;
  private maxZoom = 4;
  private zoomSpeed = 0.0015;
  private cameraLerp = 0.08;

  private selectionMarker!: Phaser.GameObjects.Image;

  private highlightedNPCId: string | null = null;

  private readonly fovAngle = Phaser.Math.DegToRad(110);
  private readonly fogColor = 0x6f7378;
  private readonly fogMaxAlpha = 0.5;
  private readonly fogFadeOutDurationMs = 2000;
  private readonly fogFadeInDurationMs = 100;

  constructor() {
    super({ key: 'MainScene' });
  }

  private preload() {
    this.load.image(TextureKey.RABBIT, 'assets/sprites/rabbit.png');
    this.load.image(TextureKey.WOLF, 'assets/sprites/wolf.png');
    this.createTileGraphics();
    this.createTileFogGraphics();
    this.createSelectionMarkerGraphics();
    generateHumanoidTextures(this, HumanoidBodyType.MALE);
  }

  private create() {
    this.worldMap = new WorldMap(this.mapWidthInTiles, this.mapHeightInTiles);
    this.entityManager = new EntityManager();

    this.createMap();
    this.spawnPlayer();
    this.setupCamera();
    this.setupInput();
    this.createSelectionMarker();
  }

  override update(_time: number, delta: number) {
    this.updateSelectionMarker();
    this.entityManager.update(delta);
    this.updateTileVisuals();
    this.updateTileFog(delta);
  }

  private createTileGraphics() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x808080, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(1, 0x000000, 0.1);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_STONE, this.tileSize, this.tileSize);
    graphics.clear();

    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(1, 0x000000, 0.1);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_DIRT, this.tileSize, this.tileSize);
    graphics.clear();

    graphics.fillStyle(0x4a7c3e, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(1, 0x000000, 0.1);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_GRASS, this.tileSize, this.tileSize);
    graphics.clear();

    graphics.fillStyle(0x4a90d9, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(1, 0x000000, 0.1);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_WATER, this.tileSize, this.tileSize);

    graphics.destroy();
  }

  private createTileFogGraphics() {
    const graphics = this.add.graphics();
    graphics.fillStyle(this.fogColor, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_FOG, this.tileSize, this.tileSize);
    graphics.destroy();
  }

  private createSelectionMarkerGraphics() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = this.tileSize;
    const thickness = 4;
    const padding = 2; // Offset from the tile edge
    const cornerLength = 12;
    const radius = 6;
    const color = 0xff8c00; // Dark Orange

    graphics.lineStyle(thickness, color, 1);

    // Top-left
    graphics.beginPath();
    graphics.moveTo(padding, padding + cornerLength);
    graphics.lineTo(padding, padding + radius);
    graphics.arc(padding + radius, padding + radius, radius, Math.PI, Math.PI * 1.5);
    graphics.lineTo(padding + cornerLength, padding);
    graphics.strokePath();

    // Top-right
    graphics.beginPath();
    graphics.moveTo(size - padding - cornerLength, padding);
    graphics.lineTo(size - padding - radius, padding);
    graphics.arc(size - padding - radius, padding + radius, radius, Math.PI * 1.5, Math.PI * 2);
    graphics.lineTo(size - padding, padding + cornerLength);
    graphics.strokePath();

    // Bottom-left
    graphics.beginPath();
    graphics.moveTo(padding, size - padding - cornerLength);
    graphics.lineTo(padding, size - padding - radius);
    graphics.arc(padding + radius, size - padding - radius, radius, Math.PI, Math.PI * 0.5, true);
    graphics.lineTo(padding + cornerLength, size - padding);
    graphics.strokePath();

    // Bottom-right
    graphics.beginPath();
    graphics.moveTo(size - padding - cornerLength, size - padding);
    graphics.lineTo(size - padding - radius, size - padding);
    graphics.arc(size - padding - radius, size - padding - radius, radius, Math.PI * 0.5, 0, true);
    graphics.lineTo(size - padding, size - padding - cornerLength);
    graphics.strokePath();

    graphics.generateTexture(TextureKey.SELECTION_MARKER, size, size);
    graphics.destroy();
  }

  private createMap() {
    const tiles = this.worldMap.getAllTiles();

    for (let y = 0; y < this.mapHeightInTiles; y++) {
      for (let x = 0; x < this.mapWidthInTiles; x++) {
        const tileData = tiles[y][x];
        const worldX = x * this.tileSize;
        const worldY = y * this.tileSize;

        const textureKey = this.getTileTexture(tileData);
        const tile = this.add.image(worldX, worldY, textureKey);
        tile.setOrigin(0, 0);
        tile.setDepth(0);

        const fog = this.add.image(worldX, worldY, TextureKey.TILE_FOG);
        fog.setOrigin(0, 0);
        fog.setDepth(1);
        fog.setAlpha(this.fogMaxAlpha);

        const key = `${x},${y}`;
        this.tileSprites.set(key, tile);
        this.tileFogSprites.set(key, fog);
        this.tileFogAmount.set(key, 1);
      }
    }
  }

  private getTileTexture(tileData: any): string {
    if (tileData.type === TileType.WATER) {
      return TextureKey.TILE_WATER;
    }

    if (tileData.vegetation) {
      return TextureKey.TILE_GRASS;
    }

    return tileData.type === TileType.STONE ? TextureKey.TILE_STONE : TextureKey.TILE_DIRT;
  }

  private updateTileVisuals(): void {
    const tiles = this.worldMap.getAllTiles();

    for (let y = 0; y < this.mapHeightInTiles; y++) {
      for (let x = 0; x < this.mapWidthInTiles; x++) {
        const tileData = tiles[y][x];
        const sprite = this.tileSprites.get(`${x},${y}`);

        if (sprite) {
          const textureKey = this.getTileTexture(tileData);
          if (sprite.texture.key !== textureKey) {
            sprite.setTexture(textureKey);
          }
        }
      }
    }
  }

  private spawnPlayer(): void {
    let x = Math.floor(this.mapWidthInTiles / 2);
    let y = Math.floor(this.mapHeightInTiles / 2);
    let attempts = 0;

    while (!this.worldMap.isWalkable(x, y) && attempts < 200) {
      x = Math.floor(Math.random() * this.mapWidthInTiles);
      y = Math.floor(Math.random() * this.mapHeightInTiles);
      attempts++;
    }

    this.player = new Player(this, x, y, this.worldMap);
    this.entityManager.addEntity(this.player);
  }

  private createSelectionMarker() {
    this.selectionMarker = this.add.image(0, 0, TextureKey.SELECTION_MARKER);
    this.selectionMarker.setOrigin(0, 0);
    this.selectionMarker.setDepth(100);
    this.selectionMarker.setVisible(false);
  }

  private updateTileFog(deltaMs: number): void {
    const sprite = this.player.getSprite();
    const centerX = sprite.x;
    const centerY = sprite.y;
    const facingAngle = this.player.getFacingAngle();
    const halfAngle = this.fovAngle / 2;
    const sightRange = this.player.getStats().getValue(StatType.SIGHT_RANGE);

    const fadeOutStep = deltaMs / this.fogFadeOutDurationMs;
    const fadeInStep = deltaMs / this.fogFadeInDurationMs;

    for (const [key, fog] of this.tileFogSprites) {
      const tileCenterX = fog.x + this.tileSize / 2;
      const tileCenterY = fog.y + this.tileSize / 2;
      const dx = tileCenterX - centerX;
      const dy = tileCenterY - centerY;
      const distance = Math.hypot(dx, dy);

      let angleDiff = Math.atan2(dy, dx) - facingAngle;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)); // normalize to [-PI, PI]

      const isVisible = distance <= sightRange && Math.abs(angleDiff) <= halfAngle;
      const targetAmount = isVisible ? 0 : 1;

      const currentAmount = this.tileFogAmount.get(key) ?? 1;
      const nextAmount =
        targetAmount < currentAmount
          ? Math.max(targetAmount, currentAmount - fadeInStep)
          : Math.min(targetAmount, currentAmount + fadeOutStep);

      if (nextAmount !== currentAmount) {
        this.tileFogAmount.set(key, nextAmount);
        fog.setAlpha(nextAmount * this.fogMaxAlpha);
      }
    }
  }

  private setupCamera() {
    const camera = this.cameras.main;
    camera.setZoom(1.5);
    camera.startFollow(this.player.getSprite(), false, this.cameraLerp, this.cameraLerp);
  }

  private setupInput() {
    const camera = this.cameras.main;

    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
        (pointer.event as any)?.preventDefault?.();

        const nextZoom = Phaser.Math.Clamp(
          camera.zoom * (1 - dy * this.zoomSpeed),
          this.minZoom,
          this.maxZoom,
        );
        camera.setZoom(nextZoom);
      },
    );
  }

  private updateSelectionMarker() {
    const pointer = this.input.activePointer;
    const camera = this.cameras.main;
    const worldPoint = this.screenToWorld(camera, pointer.x, pointer.y, camera.zoom);

    const entities = this.entityManager.getAllEntities();
    let hoveredNPC = null;

    for (const entity of entities) {
      const sprite = entity.getSprite();
      const dx = worldPoint.x - sprite.x;
      const dy = worldPoint.y - sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const spriteWidth = 'width' in sprite ? sprite.width : 48;
      if (distance < spriteWidth / 2 + 5) {
        hoveredNPC = entity;
        break;
      }
    }

    const highlightedByList =
      hoveredNPC || this.highlightedNPCId === null
        ? null
        : (entities.find((entity) => entity.getId() === this.highlightedNPCId) ?? null);

    for (const entity of entities) {
      const shouldHighlight = hoveredNPC
        ? entity === hoveredNPC
        : highlightedByList
          ? entity === highlightedByList
          : false;
      entity.setHighlight(shouldHighlight);
    }

    if (hoveredNPC) {
      this.selectionMarker.setVisible(false);
      this.game.canvas.style.cursor = 'pointer';
    } else {
      const tileX = Math.floor(worldPoint.x / this.tileSize);
      const tileY = Math.floor(worldPoint.y / this.tileSize);

      const isWithinBounds =
        tileX >= 0 && tileX < this.mapWidthInTiles && tileY >= 0 && tileY < this.mapHeightInTiles;

      if (isWithinBounds) {
        this.selectionMarker.setVisible(true);
        this.selectionMarker.setPosition(tileX * this.tileSize, tileY * this.tileSize);
        this.game.canvas.style.cursor = 'pointer';
      } else {
        this.selectionMarker.setVisible(false);
        this.game.canvas.style.cursor = 'default';
      }
    }
  }

  private screenToWorld(
    camera: Phaser.Cameras.Scene2D.Camera,
    screenX: number,
    screenY: number,
    zoom: number,
  ) {
    const centerWorldX = camera.scrollX + camera.width / 2;
    const centerWorldY = camera.scrollY + camera.height / 2;
    return new Phaser.Math.Vector2(
      centerWorldX + (screenX - camera.width / 2) / zoom,
      centerWorldY + (screenY - camera.height / 2) / zoom,
    );
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  getPlayer(): Player {
    return this.player;
  }

  focusOnEntity(entityId: string): void {
    const entities = this.entityManager.getAllEntities();
    const entity = entities.find((e) => e.getId() === entityId);

    if (!entity) return;

    const entityPos = entity.getPosition();
    const targetWorldX = entityPos.x * this.tileSize + this.tileSize / 2;
    const targetWorldY = entityPos.y * this.tileSize + this.tileSize / 2;

    const camera = this.cameras.main;

    this.tweens.add({
      targets: camera,
      scrollX: targetWorldX - camera.width / 2,
      scrollY: targetWorldY - camera.height / 2,
      duration: 600,
      ease: 'Power2',
    });
  }

  setHighlightedEntityId(entityId: string | null): void {
    this.highlightedNPCId = entityId;
  }
}
