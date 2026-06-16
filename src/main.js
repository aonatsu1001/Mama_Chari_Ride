import TitleScene from './scene/TitleScene.js';
import InstructionScene from './scene/TutorialScene.js';
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
    scene: [TitleScene, InstructionScene, GameScene, GameOverScene] 
};

// ゲームの起動
const game = new Phaser.Game(config);

// M5StickC からのデータを受け取るためのグローバルオブジェクト初期化
window.m5Data = {
    gyroY: undefined,
    isJump: false,
    isBrake: false // 💡 【新しく追加】急ブレーキ強制フラグ
};

// 🌐 既存のWebSocket接続設定
const ws = new WebSocket('ws://localhost:8765');

// ジャンプの連続暴発を防ぐための管理フラグ
let isJumpLocked = false;

// 角速度（ジャイロ）の過去3つのデータを保持するバッファ配列
let gyroHistoryY = [];

ws.onopen = () => {
    console.log('Pythonセンササーバーと接続しました！');
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        
        // 📋 ジャイロデータの受信と即時減速ブレーキ処理
        if (data.gyro) {
            const gx = data.gyro.x;
            const gy = data.gyro.y;
            const gz = data.gyro.z;

            // 3軸合成角速度（回転の大きさ）を算出 = sqrt(x² + y² + z²)
            const totalGyro = Math.sqrt(gx * gx + gy * gy + gz * gz);

            // 💡 【修正】角速度の大きさが30以下になった瞬間、強制ブレーキフラグをONにする
            if (totalGyro <= 30.0) {
                gyroHistoryY = []; 
                window.m5Data.gyroY = 0;
                window.m5Data.isBrake = true; // ➔ 急ブレーキをON！
            } else {
                window.m5Data.isBrake = false; // ➔ 通常走行時はOFF
                
                gyroHistoryY.push(gy);
                if (gyroHistoryY.length > 5) {
                    gyroHistoryY.shift();
                }
                
                const sum = gyroHistoryY.reduce((acc, val) => acc + val, 0);
                window.m5Data.gyroY = sum / gyroHistoryY.length;
            }
        }
        
        // 💡 3軸合成加速度による絶対ジャンプ判定（3.0固定・完全維持）
        if (data.acc) {
            const ax = data.acc.x;
            const ay = data.acc.y;
            const az = data.acc.z;
            
            const totalAcceleration = Math.sqrt(ax * ax + ay * ay + az * az);
            const JUMP_THRESHOLD = 1.2;
            
            if (totalAcceleration > JUMP_THRESHOLD && !isJumpLocked) {
                window.m5Data.isJump = true;
                console.log(`🔥 ジャンプ検知！ 衝撃の大きさ: ${totalAcceleration.toFixed(2)}`);
                
                isJumpLocked = true;
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