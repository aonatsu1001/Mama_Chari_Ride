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

        // ------------------------------------------
        // 1. GAME OVER の文字表示（タイトル画面と統一した極太フチ取り）
        // ------------------------------------------
        this.add.text(width / 2, height * 0.3, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold', 
            fill: '#ff3333',
            stroke: '#2b1000',  // 濃い茶フチ
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // ------------------------------------------
        // 2. 走行距離の記録表示
        // ------------------------------------------
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
        // 3. もう一度プレイ（操作説明へ戻る）ボタン
        // ==========================================
        const btnWidth = 240;
        const btnHeight = 54;
        
        // コンテナを作成してボタンの見た目をまとめる
        const container = this.add.container(width / 2, height * 0.75);
        container.setDepth(2);

        // ① ボタンの下半分だけにピッタリ沿う精密立体影
        const shadow = this.add.graphics();
        shadow.fillStyle(0x2b1000, 1); 
        shadow.fillRoundedRect(-btnWidth / 2, 0, btnWidth, (btnHeight / 2) + 4, 16);
        container.add(shadow);

        // ② ボタン本体のグラデーション座布団テクスチャを生成
        const key = 'btn_bg_retry';
        
        // 💡 【ここが修正のコア！】
        // すでにテクスチャマネージャーに 'btn_bg_retry' が登録されているか確認します。
        // まだ無い時だけ新規作成（createCanvas）にすることで、2回目の重複フリーズを完璧に防ぎます。
        if (!this.textures.exists(key)) {
            const texture = this.textures.createCanvas(key, btnWidth, btnHeight);
            const ctx = texture.context;

            // オレンジ色の縦グラデーション
            const grad = ctx.createLinearGradient(0, 0, 0, btnHeight);
            grad.addColorStop(0, '#ffaa00');    
            grad.addColorStop(1, '#e65c00'); 
            ctx.fillStyle = grad;

            // 角丸半径16pxの精密なパスを作成して塗りつぶし
            const radius = 16;
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(btnWidth - radius, 0);
            ctx.quadraticCurveTo(btnWidth, 0, btnWidth, radius);
            ctx.lineTo(btnWidth, btnHeight - radius);
            ctx.quadraticCurveTo(btnWidth, btnHeight, btnWidth - radius, btnHeight);
            ctx.lineTo(radius, btnHeight);
            ctx.quadraticCurveTo(0, btnHeight, 0, btnHeight - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.fill(); 
            texture.refresh();
        }

        // 生成（または既存）のグラデーション背景をコンテナに配置
        const btnBgImage = this.add.image(0, 0, key);
        btnBgImage.setOrigin(0.5); 
        container.add(btnBgImage);

        // ③ ボタンの文字（STARTボタンと同じクオリティのArial Black）
        const btnText = this.add.text(0, 0, 'もう一度プレイ', {
            fontSize: '24px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#2b1000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);
        container.add(btnText);

        // ④ 透明なクリック当たり判定エリアを設定
        const hitArea = new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
        btnBgImage.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        btnBgImage.input.cursor = 'pointer';

        // 💡 動作実績のある安心の遷移ロジックを完全維持
        btnBgImage.on('pointerdown', () => {
            this.scene.start('InstructionScene');
        });

        // マウスホバーでボタンと文字が連動して少し浮く演出
        btnBgImage.on('pointerover', () => {
            btnBgImage.y = -2;
            btnText.y = -2;
        });
        btnBgImage.on('pointerout', () => {
            btnBgImage.y = 0;
            btnText.y = 0;
        });
    }
}