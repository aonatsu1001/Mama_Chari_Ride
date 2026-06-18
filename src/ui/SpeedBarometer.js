/**
 * SpeedBarometer.js
 * 
 * Phaser 3 用の独立したスピードバロメーター UI コンポーネント。
 * 半円型のアナログメーター風ゲージで現在速度を視覚的に表示します。
 * 
 * 使い方:
 *   import SpeedBarometer from '../ui/SpeedBarometer.js';
 * 
 *   // create() 内で:
 *   this.speedBarometer = new SpeedBarometer(this, {
 *       x: 700,        // メーター中心のX座標
 *       y: 100,         // メーター中心のY座標
 *       radius: 60,     // メーターの半径
 *       maxSpeed: 30,   // 最大速度（km/h表示値）
 *       depth: 100      // 描画の深度
 *   });
 * 
 *   // update() 内で:
 *   this.speedBarometer.update(currentSpeed);  // 0〜maxSpeed の値
 */
export default class SpeedBarometer {
    /**
     * @param {Phaser.Scene} scene - 親シーン
     * @param {Object} config - 設定オブジェクト
     * @param {number} config.x - メーター中心のX座標 (デフォルト: 700)
     * @param {number} config.y - メーター中心のY座標 (デフォルト: 95)
     * @param {number} config.radius - メーターの半径 (デフォルト: 60)
     * @param {number} config.maxSpeed - 最大速度表示値 (デフォルト: 30)
     * @param {number} config.depth - 描画の深度 (デフォルト: 100)
     */
    constructor(scene, config = {}) {
        this.scene = scene;

        // 設定のマージ
        this.x = config.x ?? 700;
        this.y = config.y ?? 95;
        this.radius = config.radius ?? 60;
        this.maxSpeed = config.maxSpeed ?? 30;
        this.depth = config.depth ?? 100;

        // 内部状態
        this.currentDisplaySpeed = 0;   // 表示中の速度（滑らかなアニメーション用）
        this.smoothingFactor = 0.12;    // 針の追従速度（0〜1、小さいほど滑らか）

        // メーターの角度範囲（ラジアン）
        // 左下（210°）→ 右下（330°）の半円弧
        this.startAngle = Phaser.Math.DegToRad(210);
        this.endAngle = Phaser.Math.DegToRad(330);
        this.angleRange = this.endAngle - this.startAngle;

        // 描画オブジェクトの作成
        this._createBackground();
        this._createGaugeArc();
        this._createTickMarks();
        this._createNeedle();
        this._createCenterCap();
        this._createSpeedLabel();
    }

    // ============================
    // 背景パネル
    // ============================
    _createBackground() {
        this.bgGraphics = this.scene.add.graphics();
        this.bgGraphics.setDepth(this.depth);
        this.bgGraphics.setScrollFactor(0);

        // 半透明の暗い円形背景
        this.bgGraphics.fillStyle(0x0a0a1a, 0.85);
        this.bgGraphics.fillCircle(this.x, this.y, this.radius + 14);

        // 外周リング（メタリックな枠線）
        this.bgGraphics.lineStyle(2.5, 0x4a5568, 0.9);
        this.bgGraphics.strokeCircle(this.x, this.y, this.radius + 14);

        // 内側の微かなリング
        this.bgGraphics.lineStyle(1, 0x2d3748, 0.5);
        this.bgGraphics.strokeCircle(this.x, this.y, this.radius + 8);
    }

    // ============================
    // ゲージの円弧（グラデーション風）
    // ============================
    _createGaugeArc() {
        this.arcGraphics = this.scene.add.graphics();
        this.arcGraphics.setDepth(this.depth + 1);
        this.arcGraphics.setScrollFactor(0);

        // 速度帯ごとに色分けした円弧を描く（グラデーション風）
        const segments = [
            { from: 0,    to: 0.5,  color: 0x10b981 },  // 緑（低速）
            { from: 0.5,  to: 0.75, color: 0xf59e0b },  // 黄（中速）
            { from: 0.75, to: 1.0,  color: 0xef4444 },  // 赤（高速）
        ];

        const arcWidth = 6;

        for (const seg of segments) {
            const segStart = this.startAngle + this.angleRange * seg.from;
            const segEnd = this.startAngle + this.angleRange * seg.to;

            // 暗めのベースライン
            this.arcGraphics.lineStyle(arcWidth, seg.color, 0.25);
            this.arcGraphics.beginPath();
            this.arcGraphics.arc(this.x, this.y, this.radius, segStart, segEnd, false);
            this.arcGraphics.strokePath();
        }
    }

    // ============================
    // 目盛り線と数字
    // ============================
    _createTickMarks() {
        this.tickGraphics = this.scene.add.graphics();
        this.tickGraphics.setDepth(this.depth + 2);
        this.tickGraphics.setScrollFactor(0);

        this.tickLabels = [];

        // 大きい目盛り（0, 10, 20, 30）
        const majorTicks = 4;
        for (let i = 0; i < majorTicks; i++) {
            const ratio = i / (majorTicks - 1);
            const angle = this.startAngle + this.angleRange * ratio;

            const innerR = this.radius - 10;
            const outerR = this.radius - 2;
            const labelR = this.radius - 20;

            // 目盛り線
            const x1 = this.x + Math.cos(angle) * innerR;
            const y1 = this.y + Math.sin(angle) * innerR;
            const x2 = this.x + Math.cos(angle) * outerR;
            const y2 = this.y + Math.sin(angle) * outerR;

            this.tickGraphics.lineStyle(2, 0xd1d5db, 0.9);
            this.tickGraphics.beginPath();
            this.tickGraphics.moveTo(x1, y1);
            this.tickGraphics.lineTo(x2, y2);
            this.tickGraphics.strokePath();

            // 数字ラベル
            const labelX = this.x + Math.cos(angle) * labelR;
            const labelY = this.y + Math.sin(angle) * labelR;
            const speedValue = Math.round(this.maxSpeed * ratio);

            const label = this.scene.add.text(labelX, labelY, speedValue.toString(), {
                fontSize: '10px',
                fontFamily: '"Courier New", monospace',
                fill: '#9ca3af',
                fontStyle: 'bold',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 2);

            this.tickLabels.push(label);
        }

        // 小さい目盛り（5km/h 刻み）
        const minorTicks = 7; // 0, 5, 10, 15, 20, 25, 30 のうち 5, 15, 25
        for (let i = 0; i < minorTicks; i++) {
            const ratio = i / (minorTicks - 1);
            // 大目盛りと重複する位置はスキップ
            if (ratio === 0 || ratio === 1 || Math.abs(ratio - 1 / 3) < 0.01 || Math.abs(ratio - 2 / 3) < 0.01) continue;

            const angle = this.startAngle + this.angleRange * ratio;

            const innerR = this.radius - 7;
            const outerR = this.radius - 2;

            const x1 = this.x + Math.cos(angle) * innerR;
            const y1 = this.y + Math.sin(angle) * innerR;
            const x2 = this.x + Math.cos(angle) * outerR;
            const y2 = this.y + Math.sin(angle) * outerR;

            this.tickGraphics.lineStyle(1, 0x6b7280, 0.6);
            this.tickGraphics.beginPath();
            this.tickGraphics.moveTo(x1, y1);
            this.tickGraphics.lineTo(x2, y2);
            this.tickGraphics.strokePath();
        }
    }

    // ============================
    // 針（ニードル）
    // ============================
    _createNeedle() {
        this.needleGraphics = this.scene.add.graphics();
        this.needleGraphics.setDepth(this.depth + 3);
        this.needleGraphics.setScrollFactor(0);
    }

    // ============================
    // 中心キャップ（針の根元）
    // ============================
    _createCenterCap() {
        this.capGraphics = this.scene.add.graphics();
        this.capGraphics.setDepth(this.depth + 4);
        this.capGraphics.setScrollFactor(0);

        // メタリックな中心円
        this.capGraphics.fillStyle(0x374151, 1);
        this.capGraphics.fillCircle(this.x, this.y, 6);
        this.capGraphics.lineStyle(1.5, 0x6b7280, 1);
        this.capGraphics.strokeCircle(this.x, this.y, 6);

        // 光沢の小さな点
        this.capGraphics.fillStyle(0x9ca3af, 0.8);
        this.capGraphics.fillCircle(this.x - 1.5, this.y - 1.5, 2);
    }

    // ============================
    // 速度テキストラベル
    // ============================
    _createSpeedLabel() {
        // 数値表示
        this.speedText = this.scene.add.text(this.x, this.y + this.radius * 0.38, '0', {
            fontSize: '14px',
            fontFamily: '"Courier New", monospace',
            fill: '#f9fafb',
            fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 5);

        // 単位表示
        this.unitText = this.scene.add.text(this.x, this.y + this.radius * 0.38 + 14, 'km/h', {
            fontSize: '8px',
            fontFamily: '"Courier New", monospace',
            fill: '#6b7280',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 5);
    }

    // ============================
    // 針の描画更新
    // ============================
    _drawNeedle(speed) {
        this.needleGraphics.clear();

        // 速度を角度に変換
        const ratio = Phaser.Math.Clamp(speed / this.maxSpeed, 0, 1);
        const angle = this.startAngle + this.angleRange * ratio;

        const needleLength = this.radius - 14;

        // 針の先端座標
        const tipX = this.x + Math.cos(angle) * needleLength;
        const tipY = this.y + Math.sin(angle) * needleLength;

        // 針の根元（少し太い三角形風）
        const baseAngle1 = angle + Math.PI / 2;
        const baseAngle2 = angle - Math.PI / 2;
        const baseOffset = 3;

        const base1X = this.x + Math.cos(baseAngle1) * baseOffset;
        const base1Y = this.y + Math.sin(baseAngle1) * baseOffset;
        const base2X = this.x + Math.cos(baseAngle2) * baseOffset;
        const base2Y = this.y + Math.sin(baseAngle2) * baseOffset;

        // 速度帯に応じた針の色
        let needleColor;
        if (ratio < 0.5) {
            needleColor = 0xf9fafb;   // 白（低速）
        } else if (ratio < 0.75) {
            needleColor = 0xfbbf24;   // 黄（中速）
        } else {
            needleColor = 0xef4444;   // 赤（高速）
        }

        // 針の影（微かな残像）
        this.needleGraphics.fillStyle(0x000000, 0.3);
        this.needleGraphics.fillTriangle(
            base1X + 1, base1Y + 1,
            base2X + 1, base2Y + 1,
            tipX + 1, tipY + 1
        );

        // 針本体
        this.needleGraphics.fillStyle(needleColor, 1);
        this.needleGraphics.fillTriangle(base1X, base1Y, base2X, base2Y, tipX, tipY);

        // 発光ゲージ（アクティブ部分の円弧）
        this._drawActiveArc(ratio);
    }

    // ============================
    // アクティブ部分の発光円弧
    // ============================
    _drawActiveArc(ratio) {
        if (ratio < 0.01) return;

        const activeEnd = this.startAngle + this.angleRange * ratio;

        // 速度帯に応じた発光色
        let glowColor;
        if (ratio < 0.5) {
            glowColor = 0x10b981;
        } else if (ratio < 0.75) {
            glowColor = 0xf59e0b;
        } else {
            glowColor = 0xef4444;
        }

        // 発光ベース
        this.needleGraphics.lineStyle(6, glowColor, 0.7);
        this.needleGraphics.beginPath();
        this.needleGraphics.arc(this.x, this.y, this.radius, this.startAngle, activeEnd, false);
        this.needleGraphics.strokePath();

        // 外側のグロー効果
        this.needleGraphics.lineStyle(10, glowColor, 0.15);
        this.needleGraphics.beginPath();
        this.needleGraphics.arc(this.x, this.y, this.radius, this.startAngle, activeEnd, false);
        this.needleGraphics.strokePath();
    }

    // ============================
    // 公開メソッド: 速度の更新
    // ============================
    /**
     * 毎フレーム呼び出して速度を更新する
     * @param {number} speed - 現在の速度（km/h 表示値）
     */
    update(speed) {
        // 滑らかに針を追従させる（イージング）
        this.currentDisplaySpeed += (speed - this.currentDisplaySpeed) * this.smoothingFactor;

        // 針の描画更新
        this._drawNeedle(this.currentDisplaySpeed);

        // テキスト更新
        this.speedText.setText(Math.round(this.currentDisplaySpeed).toString());

        // 高速時にテキスト色を変える
        const ratio = this.currentDisplaySpeed / this.maxSpeed;
        if (ratio >= 0.75) {
            this.speedText.setFill('#ef4444');
        } else if (ratio >= 0.5) {
            this.speedText.setFill('#fbbf24');
        } else {
            this.speedText.setFill('#f9fafb');
        }
    }

    // ============================
    // 公開メソッド: 最大速度の変更
    // ============================
    /**
     * 最大速度を動的に変更する（難易度変化等で使用）
     * @param {number} newMax - 新しい最大速度値
     */
    setMaxSpeed(newMax) {
        this.maxSpeed = newMax;

        // 目盛りラベルを更新
        for (let i = 0; i < this.tickLabels.length; i++) {
            const ratio = i / (this.tickLabels.length - 1);
            this.tickLabels[i].setText(Math.round(newMax * ratio).toString());
        }
    }

    // ============================
    // 公開メソッド: 表示/非表示の切り替え
    // ============================
    /**
     * メーターの表示/非表示を切り替える
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.bgGraphics.setVisible(visible);
        this.arcGraphics.setVisible(visible);
        this.tickGraphics.setVisible(visible);
        this.needleGraphics.setVisible(visible);
        this.capGraphics.setVisible(visible);
        this.speedText.setVisible(visible);
        this.unitText.setVisible(visible);
        this.tickLabels.forEach(label => label.setVisible(visible));
    }

    // ============================
    // 公開メソッド: 破棄
    // ============================
    /**
     * メーターに関するすべてのゲームオブジェクトを破棄する
     */
    destroy() {
        this.bgGraphics.destroy();
        this.arcGraphics.destroy();
        this.tickGraphics.destroy();
        this.needleGraphics.destroy();
        this.capGraphics.destroy();
        this.speedText.destroy();
        this.unitText.destroy();
        this.tickLabels.forEach(label => label.destroy());
        this.tickLabels = [];
    }
}