export default class InstructionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. ヘッダーテキスト
        this.add.text(width / 2, height * 0.15, 'ー 操作説明 ー', {
            fontSize: '28px',
            bold: true,
            fill: '#00ffcc',
            fontFamily: 'sans-serif'
        }).setOrigin(0.5);

        // 2. 説明文
        const instructions = 
            "・加速: 矢印キー【右】 (または M5Atomを漕ぐ)\n\n" +
            "・ジャンプ: 【スペースキー】 (または M5Atomでジャンプ)\n\n" +
            "正面から壁にぶつかるか、穴に落ちるとゲームオーバー！";

        this.add.text(width / 2, height * 0.45, instructions, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'sans-serif',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        // 3. ゲーム開始ボタン
        const startButton = this.add.text(width / 2, height * 0.8, ' ゲームスタート！ ', {
            fontSize: '24px',
            fill: '#000000',
            backgroundColor: '#ffffff',
            fontFamily: 'sans-serif',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        startButton.setInteractive({ useHandCursor: true });

        // ここでようやくゲーム本編（GameScene）が始まります
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // ホバー演出
        startButton.on('pointerover', () => startButton.setBackgroundColor('#ffcc00'));
        startButton.on('pointerout', () => startButton.setBackgroundColor('#ffffff'));
    }
}