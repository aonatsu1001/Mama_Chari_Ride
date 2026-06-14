import TitleScene from './scene/TitleScene.js';
import InstructionScene from './scene/InstructionScene.js'; // ★追加
import GameScene from './scene/GameScene.js';
import GameOverScene from './scene/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,        
    height: 450,       
    parent: 'game-container',
    physics: {
        default: 'arcade', 
        arcade: {
            gravity: { y: 0 }, 
            debug: false        
        }
    },
    // ★修正：TitleScene と GameScene の間に InstructionScene を挟みます
    scene: [TitleScene, InstructionScene, GameScene, GameOverScene] 
};

// （以下、gameの起動やwindow.m5Dataの記述はそのまま）

// ゲームの起動
const game = new Phaser.Game(config);

// M5StickC からのデータを受け取るためのグローバルオブジェクト初期化
window.m5Data = {
    gyroY: undefined,
    isJump: false
};