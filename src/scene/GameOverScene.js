export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalDistance = Math.round(data.distance || 0);
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. GAME OVER の文字表示
        this.add.text(width / 2, height * 0.3, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold', 
            fill: '#ff3333',
            stroke: '#2b1000',  
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // 2. 走行距離の記録表示
        this.add.text(width / 2, height * 0.5, `走行距離: ${this.finalDistance} m`, {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#2b1000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);


        // ==========================================
        // 3. もう一度走る（リトライ）ボタン
        // ==========================================
        const btnWidth = 240;
        const btnHeight = 54;
        
        const retryContainer = this.add.container(width / 2, height * 0.68);
        retryContainer.setDepth(2);

        const retryShadow = this.add.graphics();
        retryShadow.fillStyle(0x2b1000, 1);
        retryShadow.fillRoundedRect(-btnWidth / 2, 0, btnWidth, (btnHeight / 2) + 4, 16);
        retryContainer.add(retryShadow);

        const retryKey = 'btn_bg_retry_play';
        if (!this.textures.exists(retryKey)) {
            const texture = this.textures.createCanvas(retryKey, btnWidth, btnHeight);
            const ctx = texture.context;

            const grad = ctx.createLinearGradient(0, 0, 0, btnHeight);
            grad.addColorStop(0, '#ffaa00');    
            grad.addColorStop(1, '#e65c00'); 
            ctx.fillStyle = grad;

            const radius = 16;
            ctx.beginPath();
            ctx.moveTo(radius, 0); ctx.lineTo(btnWidth - radius, 0); ctx.quadraticCurveTo(btnWidth, 0, btnWidth, radius);
            ctx.lineTo(btnWidth, btnHeight - radius); ctx.quadraticCurveTo(btnWidth, btnHeight, btnWidth - radius, btnHeight);
            ctx.lineTo(radius, btnHeight); ctx.quadraticCurveTo(0, btnHeight, 0, btnHeight - radius);
            ctx.lineTo(0, radius); ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath(); ctx.fill();  
            texture.refresh();
        }

        const retryBgImage = this.add.image(0, 0, retryKey);
        retryBgImage.setOrigin(0.5); 
        retryContainer.add(retryBgImage);

        const retryText = this.add.text(0, 0, 'もう一度走る', {
            fontSize: '24px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#2b1000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);
        retryContainer.add(retryText);

        const offsetX = 120;
        const offsetY = 20;  
        const hitX = (-btnWidth / 2) + offsetX;
        const hitY = (-btnHeight / 2) + offsetY;

        const retryHitArea = new Phaser.Geom.Rectangle(hitX, hitY, btnWidth, btnHeight);
        retryBgImage.setInteractive(retryHitArea, Phaser.Geom.Rectangle.Contains);
        retryBgImage.input.cursor = 'pointer';

        retryBgImage.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });

        retryBgImage.on('pointerover', () => { retryBgImage.y = -2; retryText.y = -2; });
        retryBgImage.on('pointerout', () => { retryBgImage.y = 0; retryText.y = 0; });


        // ==========================================
        // 4. タイトル画面へ戻る ボタン
        // 💡 【レイアウト修正】位置を height * 0.82 から 0.86 へ引き下げて綺麗に整列！
        // ==========================================
        const titleContainer = this.add.container(width / 2, height * 0.86);
        titleContainer.setDepth(2);

        const titleShadow = this.add.graphics();
        titleShadow.fillStyle(0x2b1000, 1);
        titleShadow.fillRoundedRect(-btnWidth / 2, 0, btnWidth, (btnHeight / 2) + 4, 16);
        titleContainer.add(titleShadow);

        const titleKey = 'btn_bg_to_title';
        if (!this.textures.exists(titleKey)) {
            const texture = this.textures.createCanvas(titleKey, btnWidth, btnHeight);
            const ctx = texture.context;

            const grad = ctx.createLinearGradient(0, 0, 0, btnHeight);
            grad.addColorStop(0, '#ffaa00');    
            grad.addColorStop(1, '#e65c00'); 
            ctx.fillStyle = grad;

            const radius = 16;
            ctx.beginPath();
            ctx.moveTo(radius, 0); ctx.lineTo(btnWidth - radius, 0); ctx.quadraticCurveTo(btnWidth, 0, btnWidth, radius);
            ctx.lineTo(btnWidth, btnHeight - radius); ctx.quadraticCurveTo(btnWidth, btnHeight, btnWidth - radius, btnHeight);
            ctx.lineTo(radius, btnHeight); ctx.quadraticCurveTo(0, btnHeight, 0, btnHeight - radius);
            ctx.lineTo(0, radius); ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath(); ctx.fill(); 
            texture.refresh();
        }

        const titleBgImage = this.add.image(0, 0, titleKey);
        titleBgImage.setOrigin(0.5);
        titleContainer.add(titleBgImage);

        const titleText = this.add.text(0, 0, 'タイトル画面へ', {
            fontSize: '24px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#2b1000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);
        titleContainer.add(titleText);

        const titleHitArea = new Phaser.Geom.Rectangle(hitX, hitY, btnWidth, btnHeight);
        titleBgImage.setInteractive(titleHitArea, Phaser.Geom.Rectangle.Contains);
        titleBgImage.input.cursor = 'pointer';

        titleBgImage.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.wake('TitleScene');
        });

        titleBgImage.on('pointerover', () => { titleBgImage.y = -2; titleText.y = -2; });
        titleBgImage.on('pointerout', () => { titleBgImage.y = 0; titleText.y = 0; });
    }
}