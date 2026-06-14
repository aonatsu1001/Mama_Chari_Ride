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

        // ------------------------------------------
        // ② タイトルロゴ画像 ＆ 「ママ」装飾（パラメータ完全維持）
        // ------------------------------------------
        const logoX = width / 2;
        const logoY = height * 2 / 7;
        this.logoContainer = this.add.container(logoX, logoY);
        this.logoContainer.setDepth(1);

        // 元の「チャリ走」ロゴ画像
        this.logo = this.add.image(0, 0, 'title_logo');
        this.logo.setOrigin(0.5);
        this.logoContainer.add(this.logo);

        // 「ママ」を包み込むオレンジ色の「ふきだし」背景
        const mamaBg = this.add.graphics();
        mamaBg.fillStyle(0xff8c00, 1); 

        const rectX = -155;
        const rectY = -60;
        const rectW = 100;
        const rectH = 50;
        const cornerRadius = 8; 

        mamaBg.fillRoundedRect(rectX, rectY, rectW, rectH, cornerRadius);
        mamaBg.strokeRoundedRect(rectX, rectY, rectW, rectH, cornerRadius);

        // 吹き出しの尻尾（下向きの三角形のトゲ）を底面中央に精密描画
        mamaBg.beginPath();
        mamaBg.moveTo(rectX + (rectW / 2) - 10, rectY + rectH); 
        mamaBg.lineTo(rectX + (rectW / 2) + 10, rectY + rectH); 
        mamaBg.lineTo(rectX + (rectW / 2) + 4,  rectY + rectH + 12); 
        mamaBg.closePath();
        mamaBg.fill();
        mamaBg.stroke();
        this.logoContainer.add(mamaBg);

        // 「ママ」の超肉厚テキストパラメータ設定
        // 1. 背面の太い「白フチ」
        const mamaStroke = this.add.text(-105, -35, 'ママ', {
            fontSize: '34px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: '900',
            fill: '#ffffff',       
            stroke: '#ffffff',     
            strokeThickness: 9,   
            align: 'center'
        }).setOrigin(0.5);
        this.logoContainer.add(mamaStroke);

        // 2. 前面の「黒フチ＋黒文字」
        this.mamaText = this.add.text(-105, -35, 'ママ', {
            fontSize: '34px',
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
            // ボタンが少し小さくなったため、元の「120, 30」のオフセット比率を維持したまま、
            // 新しいボタンサイズ（btnWidth, btnHeight）にジャストフィットする判定矩形を生成します。
            const offsetX = btnWidth * 0.5; // ボタンの半分の幅だけ右にずらす
            const offsetY = btnHeight * 0.5; // ボタンの半分の高さだけ下にずらす

            const hitX = (-btnWidth / 2) + offsetX;
            const hitY = (-btnHeight / 2) + offsetY;

            // 当たり判定の大きさも、小さくなったボタンの幅・高さに完全に一致させます
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
        // ③ START ボタン（📢サイズを横210×縦52に少し小さく調整、指定座標は完全維持）
        // ------------------------------------------
        const startHit = createCustomButton(width / 2, height * 0.63, 210, 52, 'START', {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',       // 文字色は白
            stroke: '#2b1000',     // 濃い茶色のフチ取り
            strokeThickness: 6,    // フチの太さ
            topColor: '#ffaa00',   // 立体ボタン用のグラデーション上部
            bottomColor: '#e65c00' // 立体ボタン用のグラデーション下部
        });

        startHit.on('pointerdown', () => {
            this.bgVideo.stop();
            this.scene.start('GameScene');
        });


        // ------------------------------------------
        // ④ 操作説明 ボタン（📢サイズを横210×縦44に少し小さく調整、指定座標は完全維持）
        // ------------------------------------------
        const infoHit = createCustomButton(width / 2, height * 0.78, 210, 44, '操作説明', {
            fontSize: '20px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#113300',     // 操作説明用に深緑のフチ取り
            strokeThickness: 5,
            topColor: '#66ff22',   // 立体ボタン用の黄緑グラデーション上部
            bottomColor: '#3bbf00' // 立体ボタン用の黄緑グラデーション下部
        });

        infoHit.on('pointerdown', () => {
            this.bgVideo.stop();
            this.scene.start('InstructionScene');
        });
    }
}