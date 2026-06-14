export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    // ==========================================
    // 1. 素材の事前読み込み
    // ==========================================
    preload() {
        // 背景動画とロゴ画像のロード
        this.load.video('title_video', 'assets/title_bg.mp4');
        this.load.image('title_logo', 'assets/title_logo.png');
    }

    // ==========================================
    // 2. 画面の構築
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // ------------------------------------------
        // ① 動画背景の設定
        // ------------------------------------------
        this.bgVideo = this.add.video(width / 2, height / 2, 'title_video');
        this.bgVideo.on('play', () => {
            this.bgVideo.setDisplaySize(width, height);
        });
        this.bgVideo.play(true, true); 
        this.bgVideo.setDepth(0); // 最背面

        // 【維持】他のシーンからこのタイトル画面に「戻ってきたとき」の復活処理
        this.events.on('wake', () => {
            if (this.bgVideo) {
                this.bgVideo.play(true, true); // 動画を再開
            }
        });

        // ------------------------------------------
        // ② タイトルロゴ画像 ＆ 「ママ」装飾（パラメータ完全維持）
        // ------------------------------------------
        const logoX = width * 5 / 9;
        const logoY = height * 2 / 7;
        this.logoContainer = this.add.container(logoX, logoY);
        this.logoContainer.setDepth(1);

        // 元の「チャリ走」ロゴ画像
        this.logo = this.add.image(0, 0, 'title_logo');
        this.logo.setOrigin(0.5);
        this.logoContainer.add(this.logo);


        // 💡 【修正のコア】きれいなアーチ状に広がる細身のオレンジ集中線
        // 「ママ」の頭上を等間隔でぐるっと囲むように、各トゲの傾きと長さを均等に再計算しました。
        const focusLines = this.add.graphics();
        focusLines.fillStyle(0xff8c00, 1); // 鮮やかなオレンジ

        // 「ママ」のテキスト中央上部を基準点（トゲの先端が向かう中心）にします
        const cx = -135;
        const cy = 15;

        // 1本目（左端：外側に大きく開くトゲ）
        focusLines.beginPath();
        focusLines.moveTo(cx - 38, cy - 30); 
        focusLines.lineTo(cx - 32, cy - 36); 
        focusLines.lineTo(cx - 18, cy - 14); // 鋭い先端
        focusLines.closePath();
        focusLines.fill();

        // 2本目（左斜め上）
        focusLines.beginPath();
        focusLines.moveTo(cx - 22, cy - 42);
        focusLines.lineTo(cx - 14, cy - 45);
        focusLines.lineTo(cx - 9,  cy - 18); // 鋭い先端
        focusLines.closePath();
        focusLines.fill();

        // 3本目（中央：真上を向くトゲ）
        focusLines.beginPath();
        focusLines.moveTo(cx - 3,  cy - 46);
        focusLines.lineTo(cx + 3,  cy - 46);
        focusLines.lineTo(cx,     cy - 19); // 鋭い先端
        focusLines.closePath();
        focusLines.fill();

        // 4本目（右斜め上）
        focusLines.beginPath();
        focusLines.moveTo(cx + 14, cy - 45);
        focusLines.lineTo(cx + 22, cy - 42);
        focusLines.lineTo(cx + 9,  cy - 18); // 鋭い先端
        focusLines.closePath();
        focusLines.fill();

        // 5本目（右端：外側に大きく開くトゲ）
        focusLines.beginPath();
        focusLines.moveTo(cx + 32, cy - 36);
        focusLines.lineTo(cx + 38, cy - 30);
        focusLines.lineTo(cx + 18, cy - 14); // 鋭い先端
        focusLines.closePath();
        focusLines.fill();

        this.logoContainer.add(focusLines);


        // 「ママ」の超肉厚テキストパラメータ設定
        // 1. 背面の太い「白フチ」
        const mamaStroke = this.add.text(-135, 25, 'ママ', {
            fontSize: '38px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: '900',
            fill: '#ffffff',       
            stroke: '#ffffff',     
            strokeThickness: 9,   
            align: 'center'
        }).setOrigin(0.5);
        this.logoContainer.add(mamaStroke);

        // 2. 前面の「黒フチ＋黒文字」
        this.mamaText = this.add.text(-135, 25, 'ママ', {
            fontSize: '38px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: '900',     
            fill: '#000000',       
            stroke: '#000000',     
            strokeThickness: 4,    
            align: 'center'
        }).setOrigin(0.5);
        this.logoContainer.add(this.mamaText);

        // パラメータ1.4倍を完全維持
        this.logoContainer.setScale(1.4);


        // ==========================================
        // 💡 共通のボタン描画関数（ボタン縮小に伴い、当たり判定サイズも自動最適化）
        // ==========================================
        const createCustomButton = (x, y, btnWidth, btnHeight, textStr, textStyleCustom) => {
            const container = this.add.container(x, y);
            container.setDepth(2);

            // 1. ボタンの下半分（中央から下）だけにピッタリ沿う精密立体影
            const shadow = this.add.graphics();
            shadow.fillStyle(Phaser.Display.Color.HexStringToColor(textStyleCustom.stroke).color, 1);
            
            const shadowX = -btnWidth / 2;
            const shadowY = 0;
            const shadowWidth = btnWidth;
            const shadowHeight = (btnHeight / 2) + 4;

            shadow.fillRoundedRect(shadowX, shadowY, shadowWidth, shadowHeight, 16);
            container.add(shadow);

            // 2. ボタン本体のグラデーション座布団テクスチャを生成
            const key = `btn_bg_${textStr}`;
            const texture = this.textures.createCanvas(key, btnWidth, btnHeight);
            const ctx = texture.context;

            // 縦方向グラデーションの作成
            const grad = ctx.createLinearGradient(0, 0, 0, btnHeight);
            grad.addColorStop(0, textStyleCustom.topColor);    // 上部の明るい色
            grad.addColorStop(1, textStyleCustom.bottomColor); // 下部の濃い色
            ctx.fillStyle = grad;

            // 角丸半径16pxの精密なパスを作成して、純粋にグラデーションの塗りのみを実行
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

            // 生成したグラデーション背景をコンテナに配置
            const btnBgImage = this.add.image(0, 0, key);
            btnBgImage.setOrigin(0.5);
            container.add(btnBgImage);

            // 3. 【完全引き継ぎ】ご指定いただいたSTARTボタンのテキスト・フォント設定
            const btnText = this.add.text(0, 0, textStr, {
                fontSize: textStyleCustom.fontSize,
                fontFamily: textStyleCustom.fontFamily,
                fontWeight: textStyleCustom.fontWeight,
                fill: textStyleCustom.fill,
                stroke: textStyleCustom.stroke,
                strokeThickness: textStyleCustom.strokeThickness,
                align: 'center'
            }).setOrigin(0.5);
            container.add(btnText);

            // 4. 💡【自動追従】透明なクリック当たり判定エリアを設定
            const offsetX = btnWidth * 0.5;
            const offsetY = btnHeight * 0.5;

            const hitX = (-btnWidth / 2) + offsetX;
            const hitY = (-btnHeight / 2) + offsetY;

            const hitArea = new Phaser.Geom.Rectangle(hitX, hitY, btnWidth, btnHeight);
            btnBgImage.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            btnBgImage.input.cursor = 'pointer';

            // インタラクティブな挙動
            btnBgImage.on('pointerover', () => {
                btnBgImage.y = -2;
                btnText.y = -2;
            });
            btnBgImage.on('pointerout', () => {
                btnBgImage.y = 0;
                btnText.y = 0;
            });

            return btnBgImage;
        };


        // ------------------------------------------
        // ③ START ボタン（横210×縦52、指定パラメータ完全維持）
        // ------------------------------------------
        const startHit = createCustomButton(width / 2, height * 0.63, 210, 52, 'START', {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',       
            stroke: '#2b1000',     
            strokeThickness: 6,    
            topColor: '#ffaa00',   
            bottomColor: '#e65c00' 
        });

        startHit.on('pointerdown', () => {
            if (this.bgVideo) this.bgVideo.pause();
            this.scene.switch('GameScene');        
        });


        // ------------------------------------------
        // ④ 操作説明 ボタン（横210×縦44、指定パラメータ完全維持）
        // ------------------------------------------
        const infoHit = createCustomButton(width / 2, height * 0.78, 210, 44, '操作説明', {
            fontSize: '20px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#113300',     
            strokeThickness: 5,
            topColor: '#66ff22',   
            bottomColor: '#3bbf00' 
        });

        infoHit.on('pointerdown', () => {
            if (this.bgVideo) this.bgVideo.pause();
            this.scene.switch('InstructionScene'); 
        });
    }
}