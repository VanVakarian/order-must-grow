import Phaser from 'phaser';
import {
  HUMANOID_CANVAS_HEIGHT,
  HUMANOID_CANVAS_WIDTH,
  HUMANOID_EYE_RADIUS,
  HUMANOID_HEAD_CENTER_Y,
  HUMANOID_HEAD_RADIUS,
  HUMANOID_OUTLINE_COLOR,
  HUMANOID_OUTLINE_WIDTH,
  HUMANOID_SIDE_TORSO_WIDTH,
  HUMANOID_SKIN_COLOR,
  HUMANOID_TORSO_HEIGHT,
  HUMANOID_TORSO_RADIUS,
  HUMANOID_TORSO_WIDTH,
  HUMANOID_TORSO_Y,
} from '../const';

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

const CANVAS_WIDTH = HUMANOID_CANVAS_WIDTH;
const CANVAS_HEIGHT = HUMANOID_CANVAS_HEIGHT;
const CENTER_X = CANVAS_WIDTH / 2;

const HEAD_RADIUS = HUMANOID_HEAD_RADIUS;
const HEAD_CY = HUMANOID_HEAD_CENTER_Y;

const TORSO_Y = HUMANOID_TORSO_Y;
const TORSO_WIDTH = HUMANOID_TORSO_WIDTH;
const SIDE_TORSO_WIDTH = HUMANOID_SIDE_TORSO_WIDTH;
const TORSO_HEIGHT = HUMANOID_TORSO_HEIGHT;
const TORSO_RADIUS = HUMANOID_TORSO_RADIUS;

const SKIN_COLOR = HUMANOID_SKIN_COLOR;
const OUTLINE_COLOR = HUMANOID_OUTLINE_COLOR;
const OUTLINE_WIDTH = HUMANOID_OUTLINE_WIDTH;
const EYE_RADIUS = HUMANOID_EYE_RADIUS;

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
    drawTorsoAndHead(graphics, SIDE_TORSO_WIDTH);
    drawSideEye(graphics);
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

function drawTorsoAndHead(
  graphics: Phaser.GameObjects.Graphics,
  torsoWidth: number = TORSO_WIDTH,
): void {
  const torsoX = CENTER_X - torsoWidth / 2;

  graphics.fillStyle(SKIN_COLOR, 1);
  graphics.lineStyle(OUTLINE_WIDTH, OUTLINE_COLOR, 1);
  graphics.fillRoundedRect(torsoX, TORSO_Y, torsoWidth, TORSO_HEIGHT, TORSO_RADIUS);
  graphics.strokeRoundedRect(torsoX, TORSO_Y, torsoWidth, TORSO_HEIGHT, TORSO_RADIUS);

  graphics.fillCircle(CENTER_X, HEAD_CY, HEAD_RADIUS);
  graphics.strokeCircle(CENTER_X, HEAD_CY, HEAD_RADIUS);
}

function drawEyes(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(OUTLINE_COLOR, 1);
  graphics.fillCircle(CENTER_X - 4, HEAD_CY - 2, EYE_RADIUS);
  graphics.fillCircle(CENTER_X + 4, HEAD_CY - 2, EYE_RADIUS);
}

function drawSideEye(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(OUTLINE_COLOR, 1);
  graphics.fillCircle(CENTER_X + 5, HEAD_CY - 2, EYE_RADIUS);
}
