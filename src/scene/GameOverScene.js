export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    // 他のシーンからデータ（今回は距離）を受け取るための設定
    init(data) {
        // GameSceneから渡された距離を記録（小数点以下を四捨五入）
        this.finalDistance = Math.round(data.distance || 0);
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. GAME OVER の文字表示（赤色で大きく）
        this.add.text(width / 2, height * 0.3, 'GAME OVER', {
            fontSize: '48px',
            bold: true,
            fill: '#ff3333',
            fontFamily: 'sans-serif'
        }).setOrigin(0.5);

        // 2. 走行距離の記録表示
        this.add.text(width / 2, height * 0.5, `走行距離: ${this.finalDistance} m`, {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'sans-serif'
        }).setOrigin(0.5);

        // 3. もう一度プレイ（操作説明へ戻る）ボタン
        const retryButton = this.add.text(width / 2, height * 0.75, ' もう一度プレイ ', {
            fontSize: '22px',
            fill: '#000000',
            backgroundColor: '#ffffff',
            fontFamily: 'sans-serif',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        retryButton.setInteractive({ useHandCursor: true });

        // ボタンクリックで InstructionScene（操作説明画面）に戻る
        retryButton.on('pointerdown', () => {
            this.scene.start('InstructionScene');
        });

        // ホバー演出
        retryButton.on('pointerover', () => retryButton.setBackgroundColor('#ffcc00'));
        retryButton.on('pointerout', () => retryButton.setBackgroundColor('#ffffff'));
    }
}