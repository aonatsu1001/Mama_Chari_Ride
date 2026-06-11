import GameScene from './scene/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,        // ゲーム画面の横幅
    height: 450,       // ゲーム画面の高さ (16:9)
    parent: 'game-container',
    physics: {
        default: 'arcade', // Phaserの2D物理エンジンを有効化
        arcade: {
            gravity: { y: 0 }, // 全体の重力（個別で設定するのでここは0）
            debug: false        // trueにすると衝突判定の枠線が見えるようになります
        }
    },
    scene: [GameScene] // 読み込むシーンのリスト
};

// ゲームの起動
const game = new Phaser.Game(config);

// M5が繋がっていない時用のダミーデータエリアを事前に定義
window.m5Data = {
    gyroY: undefined, // undefinedにしておくことで自動的にキーボードモードになります
    isJump: false
};