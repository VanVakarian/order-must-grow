import Phaser from 'phaser';

export enum HumanoidBodyType {
  MALE = 'male',
}

export enum HumanoidPose {
  FRONT = 'front',
  BACK = 'back',
  SIDE = 'side',
}

export interface HumanoidFacing {
  pose: HumanoidPose;
  flipX: boolean;
}

const CANVAS_WIDTH = 44;
const CANVAS_HEIGHT = 60;
const CENTER_X = CANVAS_WIDTH / 2;

const HEAD_RADIUS = 11;
const HEAD_CY = 15;

const TORSO_X = 8;
const TORSO_Y = 24;
const TORSO_WIDTH = 28;
const TORSO_HEIGHT = 28;
const TORSO_RADIUS = 9;
const FEET_Y = TORSO_Y + TORSO_HEIGHT;

const SIDE_LEAN_ANGLE = Phaser.Math.DegToRad(12);

const SKIN_COLOR = 0xe8dcc8;
const OUTLINE_COLOR = 0x2f2f2f;
const OUTLINE_WIDTH = 2;
const EYE_RADIUS = 1.8;

export function humanoidTextureKey(bodyType: HumanoidBodyType, pose: HumanoidPose): string {
  return `humanoid-${bodyType}-${pose}`;
}

export function resolveHumanoidFacing(facingAngle: number): HumanoidFacing {
  const quarterTurn = Math.PI / 4;

  if (facingAngle >= -quarterTurn && facingAngle < quarterTurn) {
    return { pose: HumanoidPose.SIDE, flipX: false };
  }
  if (facingAngle >= quarterTurn && facingAngle < 3 * quarterTurn) {
    return { pose: HumanoidPose.FRONT, flipX: false };
  }
  if (facingAngle >= -3 * quarterTurn && facingAngle < -quarterTurn) {
    return { pose: HumanoidPose.BACK, flipX: false };
  }
  return { pose: HumanoidPose.SIDE, flipX: true };
}

export function generateHumanoidTextures(scene: Phaser.Scene, bodyType: HumanoidBodyType): void {
  switch (bodyType) {
    case HumanoidBodyType.MALE:
      generateMaleTextures(scene);
      return;
  }
}

function generateMaleTextures(scene: Phaser.Scene): void {
  drawBody(scene, humanoidTextureKey(HumanoidBodyType.MALE, HumanoidPose.FRONT), (graphics) => {
    drawTorsoAndHead(graphics);
    drawEyes(graphics);
  });

  drawBody(scene, humanoidTextureKey(HumanoidBodyType.MALE, HumanoidPose.BACK), (graphics) => {
    drawTorsoAndHead(graphics);
  });

  drawBody(scene, humanoidTextureKey(HumanoidBodyType.MALE, HumanoidPose.SIDE), (graphics) => {
    graphics.translateCanvas(CENTER_X, FEET_Y);
    graphics.rotateCanvas(SIDE_LEAN_ANGLE);
    graphics.translateCanvas(-CENTER_X, -FEET_Y);

    drawTorsoAndHead(graphics);
    drawNose(graphics);
  });
}

function drawBody(
  scene: Phaser.Scene,
  textureKey: string,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  const graphics = scene.add.graphics();
  draw(graphics);
  graphics.generateTexture(textureKey, CANVAS_WIDTH, CANVAS_HEIGHT);
  graphics.destroy();
}

function drawTorsoAndHead(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(SKIN_COLOR, 1);
  graphics.lineStyle(OUTLINE_WIDTH, OUTLINE_COLOR, 1);
  graphics.fillRoundedRect(TORSO_X, TORSO_Y, TORSO_WIDTH, TORSO_HEIGHT, TORSO_RADIUS);
  graphics.strokeRoundedRect(TORSO_X, TORSO_Y, TORSO_WIDTH, TORSO_HEIGHT, TORSO_RADIUS);

  graphics.fillCircle(CENTER_X, HEAD_CY, HEAD_RADIUS);
  graphics.strokeCircle(CENTER_X, HEAD_CY, HEAD_RADIUS);
}

function drawEyes(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(OUTLINE_COLOR, 1);
  graphics.fillCircle(CENTER_X - 4, HEAD_CY - 2, EYE_RADIUS);
  graphics.fillCircle(CENTER_X + 4, HEAD_CY - 2, EYE_RADIUS);
}

function drawNose(graphics: Phaser.GameObjects.Graphics): void {
  const headRight = CENTER_X + HEAD_RADIUS;

  graphics.fillStyle(SKIN_COLOR, 1);
  graphics.lineStyle(OUTLINE_WIDTH, OUTLINE_COLOR, 1);
  graphics.fillTriangle(
    headRight - 3,
    HEAD_CY - 4,
    headRight - 3,
    HEAD_CY + 4,
    headRight + 4,
    HEAD_CY,
  );
  graphics.strokeTriangle(
    headRight - 3,
    HEAD_CY - 4,
    headRight - 3,
    HEAD_CY + 4,
    headRight + 4,
    HEAD_CY,
  );
}
