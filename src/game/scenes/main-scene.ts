import Phaser from 'phaser';
import {
  CAMERA_DEFAULT_ZOOM,
  CAMERA_FOCUS_TWEEN_DURATION_MS,
  CAMERA_FOLLOW_LERP,
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ZOOM,
  CAMERA_ZOOM_WHEEL_SPEED,
  ENEMY_SPAWN_OFFSET_TILES,
  ENTITY_HOVER_HIT_PADDING,
  FOG_COLOR,
  FOG_FADE_IN_DURATION_MS,
  FOG_FADE_OUT_DURATION_MS,
  FOG_MAX_ALPHA,
  FOG_UNSEEN_COLOR,
  MAIN_SCENE_CHUNK_LOAD_MARGIN_CHUNKS,
  MAIN_SCENE_CHUNK_SIZE_TILES,
  PLAYER_FOV_ANGLE,
  PLAYER_MAX_SIGHT_CONE_RANGE_TILES,
  PLAYER_NEAR_SIGHT_RADIUS_TILES,
  RENDER_DEPTH_FOG,
  RENDER_DEPTH_SELECTION_MARKER,
  RENDER_DEPTH_TILE,
  SELECTION_MARKER_COLOR,
  SELECTION_MARKER_CORNER_LENGTH,
  SELECTION_MARKER_CORNER_RADIUS,
  SELECTION_MARKER_PADDING,
  SELECTION_MARKER_THICKNESS,
  SPAWN_SEARCH_MAX_RADIUS_TILES,
  TILE_BORDER_ALPHA,
  TILE_BORDER_COLOR,
  TILE_BORDER_WIDTH,
  TILE_COLOR_DIRT,
  TILE_COLOR_GRASS,
  TILE_COLOR_STONE,
  TILE_COLOR_WATER,
  TILE_SIZE_PX,
} from '../const';
import { Enemy } from '../entities/enemy';
import { EntityManager } from '../entities/entity-manager';
import { Player } from '../entities/player';
import { generateHumanoidTextures, HumanoidBodyType } from '../rendering/humanoid-sprite-generator';
import { StatType } from '../stats/stat-type';
import { Position, TileData, TileType } from '../types';
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
  KNIFE = 'knife',
}

export class MainScene extends Phaser.Scene {
  private tileSize = TILE_SIZE_PX;
  private chunkSizeInTiles = MAIN_SCENE_CHUNK_SIZE_TILES;
  private chunkLoadMarginInChunks = MAIN_SCENE_CHUNK_LOAD_MARGIN_CHUNKS;

  private worldMap!: WorldMap;
  private entityManager!: EntityManager;
  private tileSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private tileFogSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private tileFogAmount: Map<string, number> = new Map();
  private loadedChunks: Set<string> = new Set();
  private player!: Player;

  private minZoom = CAMERA_MIN_ZOOM;
  private maxZoom = CAMERA_MAX_ZOOM;
  private defaultZoom = CAMERA_DEFAULT_ZOOM;
  private zoomSpeed = CAMERA_ZOOM_WHEEL_SPEED;
  private cameraLerp = CAMERA_FOLLOW_LERP;

  private selectionMarker!: Phaser.GameObjects.Image;

  private highlightedNPCId: string | null = null;

  private readonly fovAngle = PLAYER_FOV_ANGLE;
  private readonly maxConeRangeInTiles = PLAYER_MAX_SIGHT_CONE_RANGE_TILES;
  private readonly nearSightRadiusInTiles = PLAYER_NEAR_SIGHT_RADIUS_TILES;
  private readonly fogColor = FOG_COLOR;
  private readonly fogMaxAlpha = FOG_MAX_ALPHA;
  private readonly unseenColor = FOG_UNSEEN_COLOR;
  private readonly fogFadeOutDurationMs = FOG_FADE_OUT_DURATION_MS;
  private readonly fogFadeInDurationMs = FOG_FADE_IN_DURATION_MS;

  constructor() {
    super({ key: 'MainScene' });
  }

  private preload() {
    this.load.image(TextureKey.RABBIT, 'assets/sprites/rabbit.png');
    this.load.image(TextureKey.WOLF, 'assets/sprites/wolf.png');
    this.load.image(TextureKey.KNIFE, 'assets/sprites/knife.png');
    this.createTileGraphics();
    this.createTileFogGraphics();
    this.createSelectionMarkerGraphics();
    generateHumanoidTextures(this, HumanoidBodyType.MALE);
  }

  private create() {
    this.worldMap = new WorldMap();
    this.entityManager = new EntityManager();

    this.spawnPlayer();
    this.spawnEnemy();
    this.setupCamera();
    this.setupInput();
    this.createSelectionMarker();
    this.updateChunkStreaming();
  }

  override update(_time: number, delta: number) {
    this.updateChunkStreaming();
    this.updateSelectionMarker();
    this.entityManager.update(delta);
    this.updateTileVisuals();
    this.updateTileFog(delta);
  }

  private createTileGraphics() {
    const graphics = this.add.graphics();

    graphics.fillStyle(TILE_COLOR_STONE, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(TILE_BORDER_WIDTH, TILE_BORDER_COLOR, TILE_BORDER_ALPHA);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_STONE, this.tileSize, this.tileSize);
    graphics.clear();

    graphics.fillStyle(TILE_COLOR_DIRT, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(TILE_BORDER_WIDTH, TILE_BORDER_COLOR, TILE_BORDER_ALPHA);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_DIRT, this.tileSize, this.tileSize);
    graphics.clear();

    graphics.fillStyle(TILE_COLOR_GRASS, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(TILE_BORDER_WIDTH, TILE_BORDER_COLOR, TILE_BORDER_ALPHA);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_GRASS, this.tileSize, this.tileSize);
    graphics.clear();

    graphics.fillStyle(TILE_COLOR_WATER, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.lineStyle(TILE_BORDER_WIDTH, TILE_BORDER_COLOR, TILE_BORDER_ALPHA);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_WATER, this.tileSize, this.tileSize);

    graphics.destroy();
  }

  private createTileFogGraphics() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);
    graphics.generateTexture(TextureKey.TILE_FOG, this.tileSize, this.tileSize);
    graphics.destroy();
  }

  private createSelectionMarkerGraphics() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = this.tileSize;
    const thickness = SELECTION_MARKER_THICKNESS;
    const padding = SELECTION_MARKER_PADDING;
    const cornerLength = SELECTION_MARKER_CORNER_LENGTH;
    const radius = SELECTION_MARKER_CORNER_RADIUS;
    const color = SELECTION_MARKER_COLOR;

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

  private updateChunkStreaming(): void {
    const neededChunks = this.computeNeededChunkKeys();

    for (const key of this.loadedChunks) {
      if (!neededChunks.has(key)) {
        this.unloadChunk(key);
      }
    }

    for (const key of neededChunks) {
      if (!this.loadedChunks.has(key)) {
        this.loadChunk(key);
      }
    }

    this.loadedChunks = neededChunks;
  }

  private computeNeededChunkKeys(): Set<string> {
    const view = this.cameras.main.worldView;
    const chunkPixelSize = this.chunkSizeInTiles * this.tileSize;

    const minChunkX = Math.floor(view.x / chunkPixelSize) - this.chunkLoadMarginInChunks;
    const maxChunkX = Math.floor(view.right / chunkPixelSize) + this.chunkLoadMarginInChunks;
    const minChunkY = Math.floor(view.y / chunkPixelSize) - this.chunkLoadMarginInChunks;
    const maxChunkY = Math.floor(view.bottom / chunkPixelSize) + this.chunkLoadMarginInChunks;

    const keys = new Set<string>();
    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        keys.add(`${cx},${cy}`);
      }
    }

    return keys;
  }

  private loadChunk(chunkKey: string): void {
    const [cx, cy] = chunkKey.split(',').map(Number);

    for (let ly = 0; ly < this.chunkSizeInTiles; ly++) {
      for (let lx = 0; lx < this.chunkSizeInTiles; lx++) {
        this.createTileSprites(cx * this.chunkSizeInTiles + lx, cy * this.chunkSizeInTiles + ly);
      }
    }
  }

  private unloadChunk(chunkKey: string): void {
    const [cx, cy] = chunkKey.split(',').map(Number);

    for (let ly = 0; ly < this.chunkSizeInTiles; ly++) {
      for (let lx = 0; lx < this.chunkSizeInTiles; lx++) {
        const tileKey = `${cx * this.chunkSizeInTiles + lx},${cy * this.chunkSizeInTiles + ly}`;

        this.tileSprites.get(tileKey)?.destroy();
        this.tileFogSprites.get(tileKey)?.destroy();
        this.tileSprites.delete(tileKey);
        this.tileFogSprites.delete(tileKey);
        this.tileFogAmount.delete(tileKey);
      }
    }
  }

  private createTileSprites(tileX: number, tileY: number): void {
    const tileData = this.worldMap.getTile(tileX, tileY);
    const worldX = tileX * this.tileSize;
    const worldY = tileY * this.tileSize;

    const textureKey = this.getTileTexture(tileData);
    const tile = this.add.image(worldX, worldY, textureKey);
    tile.setOrigin(0, 0);
    tile.setDepth(RENDER_DEPTH_TILE);

    const fog = this.add.image(worldX, worldY, TextureKey.TILE_FOG);
    fog.setOrigin(0, 0);
    fog.setDepth(RENDER_DEPTH_FOG);
    fog.setTint(tileData.everSeen ? this.fogColor : this.unseenColor);
    fog.setAlpha(tileData.everSeen ? this.fogMaxAlpha : 1);

    const key = `${tileX},${tileY}`;
    this.tileSprites.set(key, tile);
    this.tileFogSprites.set(key, fog);
    this.tileFogAmount.set(key, 1);
  }

  private getTileTexture(tileData: TileData): string {
    if (tileData.type === TileType.WATER) {
      return TextureKey.TILE_WATER;
    }

    if (tileData.vegetation) {
      return TextureKey.TILE_GRASS;
    }

    return tileData.type === TileType.STONE ? TextureKey.TILE_STONE : TextureKey.TILE_DIRT;
  }

  private updateTileVisuals(): void {
    for (const [key, sprite] of this.tileSprites) {
      const [x, y] = key.split(',').map(Number);
      const tileData = this.worldMap.getTile(x, y);
      const textureKey = this.getTileTexture(tileData);
      if (sprite.texture.key !== textureKey) {
        sprite.setTexture(textureKey);
      }
    }
  }

  private spawnPlayer(): void {
    const spawnPosition = this.findWalkableSpawnPosition();
    this.player = new Player(this, spawnPosition.x, spawnPosition.y, this.worldMap, this.entityManager);
    this.entityManager.addEntity(this.player);
  }

  private spawnEnemy(): void {
    const playerPosition = this.player.getPosition();
    const spawnPosition = this.findWalkableSpawnPosition(
      Math.round(playerPosition.x) + ENEMY_SPAWN_OFFSET_TILES,
      Math.round(playerPosition.y),
    );
    const enemy = new Enemy(this, spawnPosition.x, spawnPosition.y);
    this.entityManager.addEntity(enemy);
  }

  private findWalkableSpawnPosition(centerX = 0, centerY = 0): Position {
    if (this.worldMap.isWalkable(centerX, centerY)) {
      return { x: centerX, y: centerY };
    }

    for (let radius = 1; radius <= SPAWN_SEARCH_MAX_RADIUS_TILES; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          if (this.worldMap.isWalkable(centerX + dx, centerY + dy)) {
            return { x: centerX + dx, y: centerY + dy };
          }
        }
      }
    }

    return { x: centerX, y: centerY };
  }

  private createSelectionMarker() {
    this.selectionMarker = this.add.image(0, 0, TextureKey.SELECTION_MARKER);
    this.selectionMarker.setOrigin(0, 0);
    this.selectionMarker.setDepth(RENDER_DEPTH_SELECTION_MARKER);
    this.selectionMarker.setVisible(false);
  }

  private updateTileFog(deltaMs: number): void {
    const sprite = this.player.getSprite();
    const centerX = sprite.x;
    const centerY = sprite.y;
    const facingAngle = this.player.getFacingAngle();
    const halfAngle = this.fovAngle / 2;
    const coneRange = Math.min(
      this.player.getStats().getValue(StatType.SIGHT_RANGE),
      this.maxConeRangeInTiles * this.tileSize,
    );
    const nearSightRadius = this.nearSightRadiusInTiles * this.tileSize;

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

      const isInCone = distance <= coneRange && Math.abs(angleDiff) <= halfAngle;
      const isNear = distance <= nearSightRadius;
      const isVisible = isInCone || isNear;

      const [tileX, tileY] = key.split(',').map(Number);
      const tileData = this.worldMap.getTile(tileX, tileY);

      if (isVisible && !tileData.everSeen) {
        tileData.everSeen = true;
        fog.setTint(this.fogColor);
      }

      const maxAlpha = tileData.everSeen ? this.fogMaxAlpha : 1;
      const targetAmount = isVisible ? 0 : 1;

      const currentAmount = this.tileFogAmount.get(key) ?? 1;
      const nextAmount =
        targetAmount < currentAmount
          ? Math.max(targetAmount, currentAmount - fadeInStep)
          : Math.min(targetAmount, currentAmount + fadeOutStep);

      if (nextAmount !== currentAmount) {
        this.tileFogAmount.set(key, nextAmount);
        fog.setAlpha(nextAmount * maxAlpha);
      }
    }
  }

  private setupCamera() {
    const camera = this.cameras.main;
    camera.setZoom(this.defaultZoom);
    camera.startFollow(this.player.getSprite(), false, this.cameraLerp, this.cameraLerp);
  }

  setZoom(value: number): void {
    this.cameras.main.setZoom(Phaser.Math.Clamp(value, this.minZoom, this.maxZoom));
  }

  getZoom(): number {
    return this.cameras.main.zoom;
  }

  getZoomRange(): { min: number; max: number } {
    return { min: this.minZoom, max: this.maxZoom };
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
    const ctrlHeld = !!(pointer.event as MouseEvent | undefined)?.ctrlKey;

    const entities = this.entityManager.getAllEntities();
    let hoveredNPC = null;

    if (ctrlHeld) {
      for (const entity of entities) {
        const sprite = entity.getSprite();
        const dx = worldPoint.x - sprite.x;
        const dy = worldPoint.y - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const spriteWidth = 'width' in sprite ? sprite.width : TILE_SIZE_PX;
        if (distance < spriteWidth / 2 + ENTITY_HOVER_HIT_PADDING) {
          hoveredNPC = entity;
          break;
        }
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

    if (!ctrlHeld) {
      this.selectionMarker.setVisible(false);
      this.game.canvas.style.cursor = 'default';
    } else if (hoveredNPC) {
      this.selectionMarker.setVisible(false);
      this.game.canvas.style.cursor = 'pointer';
    } else {
      const tileX = Math.floor(worldPoint.x / this.tileSize);
      const tileY = Math.floor(worldPoint.y / this.tileSize);

      this.selectionMarker.setVisible(true);
      this.selectionMarker.setPosition(tileX * this.tileSize, tileY * this.tileSize);
      this.game.canvas.style.cursor = 'pointer';
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
      duration: CAMERA_FOCUS_TWEEN_DURATION_MS,
      ease: 'Power2',
    });
  }

  setHighlightedEntityId(entityId: string | null): void {
    this.highlightedNPCId = entityId;
  }
}
