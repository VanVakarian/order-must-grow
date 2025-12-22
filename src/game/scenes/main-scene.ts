import Phaser from 'phaser';

enum TextureKey {
  TILE_GROUND = 'tile-ground',
  SELECTION_MARKER = 'selection-marker',
}

enum ZoomAnchorMode {
  CURSOR,
  CENTER,
}

export class MainScene extends Phaser.Scene {
  private tileSize = 48;
  private mapWidthInTiles = 12;
  private mapHeightInTiles = 12;

  private minZoom = 0.5;
  private maxZoom = 4;
  private zoomSpeed = 0.0015;

  private zoomAnchorMode: ZoomAnchorMode = ZoomAnchorMode.CENTER;
  // private zoomAnchorMode: ZoomAnchorMode = ZoomAnchorMode.CURSOR;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartScrollX = 0;
  private cameraStartScrollY = 0;

  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private keyboardSpeed = 0.6;

  private selectionMarker!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'MainScene' });
  }

  private preload() {
    this.createTileGraphics();
    this.createSelectionMarkerGraphics();
  }

  private create() {
    this.createMap();
    this.setupCamera();
    this.setupInput();
    this.createSelectionMarker();
  }

  override update(_time: number, delta: number) {
    this.handleKeyboardInput(delta);
    this.updateSelectionMarker();
  }

  private createTileGraphics() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(0, 0, this.tileSize, this.tileSize);

    graphics.lineStyle(1, 0x000000, 0.1);
    graphics.strokeRect(0, 0, this.tileSize, this.tileSize);

    graphics.generateTexture(TextureKey.TILE_GROUND, this.tileSize, this.tileSize);
    graphics.destroy();
  }

  private createSelectionMarkerGraphics() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = this.tileSize;
    const thickness = 4;
    const padding = 2; // Offset from the tile edge
    const cornerLength = 12;
    const radius = 6;
    const color = 0xffa500; // Orange

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
    for (let y = 0; y < this.mapHeightInTiles; y++) {
      for (let x = 0; x < this.mapWidthInTiles; x++) {
        const worldX = x * this.tileSize;
        const worldY = y * this.tileSize;
        const tile = this.add.image(worldX, worldY, TextureKey.TILE_GROUND);
        tile.setOrigin(0, 0);
        tile.setDepth(0);
      }
    }
  }

  private createSelectionMarker() {
    this.selectionMarker = this.add.image(0, 0, TextureKey.SELECTION_MARKER);
    this.selectionMarker.setOrigin(0, 0);
    this.selectionMarker.setDepth(100);
    this.selectionMarker.setVisible(false);
  }

  private setupCamera() {
    const camera = this.cameras.main;
    camera.setZoom(1.5);

    const worldWidth = this.mapWidthInTiles * this.tileSize;
    const worldHeight = this.mapHeightInTiles * this.tileSize;
    camera.centerOn(worldWidth / 2, worldHeight / 2);
  }

  private setupInput() {
    const camera = this.cameras.main;

    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
        (pointer.event as any)?.preventDefault?.();
        (pointer.event as any)?.stopPropagation?.();

        this.scale.updateBounds();

        const eventTarget = (pointer.event as any)?.target;
        const isCanvasTarget = eventTarget === this.game.canvas;
        if (!isCanvasTarget) return;

        const worldWidth = this.mapWidthInTiles * this.tileSize;
        const worldHeight = this.mapHeightInTiles * this.tileSize;

        const rawOffsetX = (pointer.event as any)?.offsetX;
        const rawOffsetY = (pointer.event as any)?.offsetY;

        const displayW = this.scale.displaySize?.width ?? this.scale.gameSize.width;
        const displayH = this.scale.displaySize?.height ?? this.scale.gameSize.height;

        const screenX =
          typeof rawOffsetX === 'number'
            ? (rawOffsetX / displayW) * this.scale.gameSize.width
            : pointer.x;
        const screenY =
          typeof rawOffsetY === 'number'
            ? (rawOffsetY / displayH) * this.scale.gameSize.height
            : pointer.y;

        const cursorWorld = this.screenToWorld(camera, screenX, screenY, camera.zoom);
        cursorWorld.x >= 0 &&
          cursorWorld.y >= 0 &&
          cursorWorld.x < worldWidth &&
          cursorWorld.y < worldHeight;

        const anchorScreenX =
          this.zoomAnchorMode === ZoomAnchorMode.CENTER ? camera.width / 2 : screenX;
        const anchorScreenY =
          this.zoomAnchorMode === ZoomAnchorMode.CENTER ? camera.height / 2 : screenY;

        const previousZoom = camera.zoom;
        const before = this.screenToWorld(camera, anchorScreenX, anchorScreenY, previousZoom);

        const nextZoom = Phaser.Math.Clamp(
          previousZoom * (1 - dy * this.zoomSpeed),
          this.minZoom,
          this.maxZoom
        );

        if (nextZoom === previousZoom) return;

        camera.setZoom(nextZoom);

        const nextScroll = this.worldToScroll(
          camera,
          before.x,
          before.y,
          anchorScreenX,
          anchorScreenY,
          nextZoom
        );
        camera.setScroll(nextScroll.x, nextScroll.y);
      }
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.cameraStartScrollX = camera.scrollX;
      this.cameraStartScrollY = camera.scrollY;
    });

    this.input.on(Phaser.Input.Events.POINTER_UP, () => {
      this.isDragging = false;
    });

    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, () => {
      this.isDragging = false;
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;

      const dx = (pointer.x - this.dragStartX) / camera.zoom;
      const dy = (pointer.y - this.dragStartY) / camera.zoom;

      camera.scrollX = this.cameraStartScrollX - dx;
      camera.scrollY = this.cameraStartScrollY - dy;
    });

    if (this.input.keyboard) {
      this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      }) as any;
    }
  }

  private handleKeyboardInput(delta: number) {
    if (!this.wasd) return;

    const camera = this.cameras.main;
    let moveX = 0;
    let moveY = 0;

    if (this.wasd.left.isDown) moveX -= 1;
    if (this.wasd.right.isDown) moveX += 1;
    if (this.wasd.up.isDown) moveY -= 1;
    if (this.wasd.down.isDown) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      const movement = new Phaser.Math.Vector2(moveX, moveY)
        .normalize()
        .scale(this.keyboardSpeed * delta);
      camera.scrollX += movement.x / camera.zoom;
      camera.scrollY += movement.y / camera.zoom;
    }
  }

  private updateSelectionMarker() {
    const pointer = this.input.activePointer;
    const camera = this.cameras.main;
    const worldPoint = this.screenToWorld(camera, pointer.x, pointer.y, camera.zoom);

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

  private screenToWorld(
    camera: Phaser.Cameras.Scene2D.Camera,
    screenX: number,
    screenY: number,
    zoom: number
  ) {
    const centerWorldX = camera.scrollX + camera.width / 2;
    const centerWorldY = camera.scrollY + camera.height / 2;
    return new Phaser.Math.Vector2(
      centerWorldX + (screenX - camera.width / 2) / zoom,
      centerWorldY + (screenY - camera.height / 2) / zoom
    );
  }

  private worldToScroll(
    camera: Phaser.Cameras.Scene2D.Camera,
    worldX: number,
    worldY: number,
    screenX: number,
    screenY: number,
    zoom: number
  ) {
    const centerWorldX = worldX - (screenX - camera.width / 2) / zoom;
    const centerWorldY = worldY - (screenY - camera.height / 2) / zoom;
    return new Phaser.Math.Vector2(
      centerWorldX - camera.width / 2,
      centerWorldY - camera.height / 2
    );
  }
}
