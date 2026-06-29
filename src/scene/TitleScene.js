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

        // ★★★ 追加：タイトル用BGMの読み込み ★★★
        // ご用意した音声ファイル名に合わせて書き換えてください
        this.load.audio('title_bgm', 'assets/bgm/title_bgm.mp3'); 
    }

    // ==========================================
    // 2. 画面の構築
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // ★★★ 追加：BGMの準備と再生 ★★★
        this.titleBgm = this.sound.add('title_bgm', { loop: true, volume: 0.5 });
        this.titleBgm.play();

        // ------------------------------------------
        // ① 動画背景の設定
        // ------------------------------------------
        this.bgVideo = this.add.video(width / 2, height / 2, 'title_video');
        this.bgVideo.on('play', () => {
            this.bgVideo.setDisplaySize(width, height);
        });
        this.bgVideo.play(true, true); 
        this.bgVideo.setDepth(0); // 最背面

        // 💡 ゲームオーバー画面等から戻ってきた時（wakeイベント）の処理
        this.events.on('wake', () => {
            // 動画の頭出し＆リスタート
            if (this.bgVideo) {
                this.bgVideo.stop(); 
                this.bgVideo.play(true, true); 
            }
            // ★★★ 追加：BGMが止まっていたら再び鳴らす ★★★
            if (this.titleBgm && !this.titleBgm.isPlaying) {
                this.titleBgm.play();
            }
        });

        // ------------------------------------------
        // ② タイトルロゴ画像 ＆ 「ママ」装飾
        // ------------------------------------------
        const logoX = width * 5 / 9;
        const logoY = height * 2 / 7;
        this.logoContainer = this.add.container(logoX, logoY);
        this.logoContainer.setDepth(1);

        this.logo = this.add.image(0, 0, 'title_logo');
        this.logo.setOrigin(0.5);
        this.logoContainer.add(this.logo);

        const focusLines = this.add.graphics();
        focusLines.fillStyle(0xff8c00, 1); 

        const cx = -135;
        const cy = 15;

        focusLines.beginPath(); focusLines.moveTo(cx - 38, cy - 30); focusLines.lineTo(cx - 32, cy - 36); focusLines.lineTo(cx - 18, cy - 14); focusLines.closePath(); focusLines.fill();
        focusLines.beginPath(); focusLines.moveTo(cx - 22, cy - 42); focusLines.lineTo(cx - 14, cy - 45); focusLines.lineTo(cx - 9,  cy - 18); focusLines.closePath(); focusLines.fill();
        focusLines.beginPath(); focusLines.moveTo(cx - 3,  cy - 46); focusLines.lineTo(cx + 3,  cy - 46); focusLines.lineTo(cx,     cy - 19); focusLines.closePath(); focusLines.fill();
        focusLines.beginPath(); focusLines.moveTo(cx + 14, cy - 45); focusLines.lineTo(cx + 22, cy - 42); focusLines.lineTo(cx + 9,  cy - 18); focusLines.closePath(); focusLines.fill();
        focusLines.beginPath(); focusLines.moveTo(cx + 32, cy - 36); focusLines.lineTo(cx + 38, cy - 30); focusLines.lineTo(cx + 18, cy - 14); focusLines.closePath(); focusLines.fill();
        this.logoContainer.add(focusLines);

        const mamaStroke = this.add.text(-135, 25, 'ママ', {
            fontSize: '38px', fontFamily: 'Arial Black, sans-serif', fontWeight: '900', fill: '#ffffff', stroke: '#ffffff', strokeThickness: 9, align: 'center'
        }).setOrigin(0.5);
        this.logoContainer.add(mamaStroke);

        this.mamaText = this.add.text(-135, 25, 'ママ', {
            fontSize: '38px', fontFamily: 'Arial Black, sans-serif', fontWeight: '900', fill: '#000000', stroke: '#000000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5);
        this.logoContainer.add(this.mamaText);

        this.logoContainer.setScale(1.4);

        // ==========================================
        // 💡 共通のボタン描画関数
        // ==========================================
        const createCustomButton = (x, y, btnWidth, btnHeight, textStr, textStyleCustom) => {
            const container = this.add.container(x, y);
            container.setDepth(2);

            const shadow = this.add.graphics();
            shadow.fillStyle(Phaser.Display.Color.HexStringToColor(textStyleCustom.stroke).color, 1);
            
            const shadowX = -btnWidth / 2;
            const shadowY = 0;
            const shadowWidth = btnWidth;
            const shadowHeight = (btnHeight / 2) + 4;

            shadow.fillRoundedRect(shadowX, shadowY, shadowWidth, shadowHeight, 16);
            container.add(shadow);

            const key = `btn_bg_${textStr}`;
            const texture = this.textures.createCanvas(key, btnWidth, btnHeight);
            const ctx = texture.context;

            const grad = ctx.createLinearGradient(0, 0, 0, btnHeight);
            grad.addColorStop(0, textStyleCustom.topColor);    
            grad.addColorStop(1, textStyleCustom.bottomColor); 
            ctx.fillStyle = grad;

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

            const btnBgImage = this.add.image(0, 0, key);
            btnBgImage.setOrigin(0.5);
            container.add(btnBgImage);

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

            const offsetX = btnWidth * 0.5;
            const offsetY = btnHeight * 0.5;
            const hitX = (-btnWidth / 2) + offsetX;
            const hitY = (-btnHeight / 2) + offsetY;

            const hitArea = new Phaser.Geom.Rectangle(hitX, hitY, btnWidth, btnHeight);
            btnBgImage.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            btnBgImage.input.cursor = 'pointer';

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
        // ③ START ボタン
        // ------------------------------------------
        const startHit = createCustomButton(width / 2, height * 0.63, 210, 52, 'START', {
            fontSize: '28px', fontFamily: 'Arial Black, sans-serif', fontWeight: 'bold', fill: '#ffffff', stroke: '#2b1000', strokeThickness: 6, topColor: '#ffaa00', bottomColor: '#e65c00' 
        });

        startHit.on('pointerdown', () => {
            if (this.bgVideo) this.bgVideo.pause();
            
            // ★★★ 追加：シーン遷移の直前にタイトルBGMを完全に止める ★★★
            if (this.titleBgm) this.titleBgm.stop();
            
            this.scene.switch('GameScene');        
        });

        // ------------------------------------------
        // ④ チュートリアル ボタン
        // ------------------------------------------
        const infoHit = createCustomButton(width / 2, height * 0.78, 210, 44, 'チュートリアル', {
            fontSize: '20px', fontFamily: 'Arial Black, sans-serif', fontWeight: 'bold', fill: '#ffffff', stroke: '#113300', strokeThickness: 5, topColor: '#66ff22', bottomColor: '#3bbf00' 
        });

        infoHit.on('pointerdown', () => {
            if (this.bgVideo) this.bgVideo.pause();
            
            // ★★★ 追加：シーン遷移の直前にタイトルBGMを完全に止める ★★★
            if (this.titleBgm) this.titleBgm.stop();
            
            this.scene.switch('TutorialScene'); 
        });
    }
}