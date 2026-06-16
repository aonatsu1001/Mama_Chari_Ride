import TitleScene from './scene/TitleScene.js';
import InstructionScene from './scene/TutorialScene.js'; // ★追加
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

// 🌐 既存のWebSocket接続設定
const ws = new WebSocket('ws://localhost:8765');

// ジャンプの連続暴発を防ぐための管理フラグ
let isJumpLocked = false;

ws.onopen = () => {
    console.log('Pythonセンササーバーと接続しました！');
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        
        // 📋 ジャイロデータの受信（変更なし）
        if (data.gyro) {
            window.m5Data.gyroY = data.gyro.y; 
        }
        
        // 💡 【ここを完全に修正：3軸合成加速度による方向不問ジャンプ判定】
        if (data.acc) {
            const ax = data.acc.x;
            const ay = data.acc.y;
            const az = data.acc.z;
            
            // 📐 3軸の値をそれぞれ2乗して足し、ルート（平方根）を計算して「総合的な衝撃の大きさ」を出す
            const totalAcceleration = Math.sqrt(ax * ax + ay * ay + az * az);
            
            // ➔ M5StickCの元データの出力仕様（G（重力加速度単位）か、m/s²か）によって基準値が変わります。
            // 基準値の目安：
            //   - M5がG出力（静止時に約1.0）の場合 ➔ 2.5 〜 3.0 付近
            //   - M5がm/s²出力（静止時に約9.8）の場合 ➔ 15.0 〜 20.0 付近
            // ※まずは実機で静止状態・振った状態の totalAcceleration の値を console.log で見て調整してください。
            const JUMP_THRESHOLD = 1.2; 
            
            // 閾値を超えており、かつロックされていない（前回のジャンプから0.5秒以上経っている）場合のみ実行
           if (ay > 0 && totalAcceleration > JUMP_THRESHOLD && !isJumpLocked) {
                
                // ジャンプフラグをTrueにする
                window.m5Data.isJump = true;
                console.log(`🔥 ジャンプ検知！ 衝撃の大きさ: ${totalAcceleration.toFixed(2)}`);
                
                // 即座に入力をロックして、センサーの残響ノイズを完全に無視する状態にする
                isJumpLocked = true;
                
                // 500ミリ秒（0.5秒）経ったらロックを解除し、次のジャンプを許可する
                setTimeout(() => {
                    isJumpLocked = false;
                }, 500);
            }
        }
    } catch (e) {
        console.error('データ解析エラー:', e);
    }
};

ws.onclose = () => {
    console.log('Pythonセンササーバーとの接続が切断されました。');
};