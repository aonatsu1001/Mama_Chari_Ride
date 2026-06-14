import TitleScene from './scene/TitleScene.js';
import GameScene from './scene/GameScene.js';

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
    // 💡 解決策のコア：
    // 配列の先頭（1番目）にあるシーンが、ゲーム起動時に最初に読み込まれます。
    // TitleScene を先頭に配置することで、必ずタイトル画面からゲームが始まるようになります。
    scene: [TitleScene, GameScene] 
};

const game = new Phaser.Game(config);

// M5StickC からのデータを受け取るためのグローバルオブジェクト初期化
window.m5Data = {
    gyroY: undefined,
    isJump: false
};