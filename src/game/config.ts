import Phaser from 'phaser';
import { GAME_BACKGROUND_COLOR } from './const';
import { MainScene } from './scenes/main-scene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: GAME_BACKGROUND_COLOR,
  disableContextMenu: true,
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
};
