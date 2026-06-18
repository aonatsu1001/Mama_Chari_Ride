import SpeedBarometer from '../ui/SpeedBarometer.js';

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    // ==========================================
    // 1. 画像・音声などの素材の事前読み込み
    // ==========================================
    preload() {
        this.load.image('background', 'assets/bg.png');
        this.load.image('player', 'assets/player.png');

        this.load.image('floor', 'assets/floor.png');
        this.load.image('floor_left', 'assets/floor_left.png');
        this.load.image('floor_right', 'assets/floor_right.png');
        this.load.image('cactus', 'assets/cactus.png');

        // ゴールフラッグの画像アセット
        this.load.image('goal', 'assets/goal.png');

        // サウンド
        this.load.audio('bgm', 'assets/bgm/bgm.mp3');
        this.load.audio('se_countdown', 'assets/se/countdown.mp3');
        this.load.audio('se_go', 'assets/se/go.mp3');
        this.load.audio('se_jump', 'assets/se/jump.mp3');
        this.load.audio('se_hit', 'assets/se/hit.mp3');
        this.load.audio('se_gameover', 'assets/se/gameover.mp3');
        this.load.audio('se_goal', 'assets/se/goal.mp3');
    }

    // ==========================================
    // 2. ゲーム画面の初期化・固定ステージオブジェクトの配置
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // BGMの準備
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });

        // 背景のループ配置
        this.background = this.add.tileSprite(0, 0, width, height, 'background');
        this.background.setOrigin(0, 0);

        // アセットのサイズに基づくパラメータ計算
        const initialFloorHeight = 112;
        this.floorHeight = initialFloorHeight;

        const originalLeftWidth = 217;
        const originalLeftHeight = 249;
        const originalRightWidth = 237;
        const originalRightHeight = 249;

        this.leftScaleY = this.floorHeight / originalLeftHeight;
        this.rightScaleY = this.floorHeight / originalRightHeight;

        this.edgeLeftWidth = Math.floor(originalLeftWidth * this.leftScaleY);
        this.edgeRightWidth = Math.floor(originalRightWidth * this.rightScaleY);

        // 💡 【本編と完全同期】物理パラメータを GameScene の最高速度に合わせます
        this.maxSpeed = 12;                // ➔ 本編のmaxSpeed=12へ同期
        this.jumpPower = -780;
        const gravityY = 1800;

        this.scrollSpeed = 0;
        this.acceleration = 0.05;
        this.friction = 0.92;    // ブレーキ強化仕様
        this.canJump = true;
        this.jumpCooldown = 300;

        this.distance = 0;
        this.isGameOverTriggered = false;
        this.isGoalAchieved = false;

        // 物理管理グループの作成
        this.platforms = this.physics.add.staticGroup();
        this.cacti = this.physics.add.staticGroup();

        // ------------------------------------------
        // 固定ステージマップデザインの設計（オーバーラップ適用版）
        // ------------------------------------------
        // ① 初期足場
        const platform1Width = 800;
        const p1CenterWidth = platform1Width - this.edgeRightWidth;
        const p1Center = this.add.tileSprite(0, height - this.floorHeight, p1CenterWidth + 1, this.floorHeight, 'floor').setOrigin(0, 0);
        const p1Right = this.add.sprite(p1CenterWidth, height - this.floorHeight, 'floor_right').setOrigin(0, 0).setScale(this.rightScaleY);
        this.platforms.add(p1Center);
        this.platforms.add(p1Right);

        // 固定値の穴のサイズ
        const holeWidth = 100;

        // ② 第2足場
        const platform2X = platform1Width + holeWidth - 1;
        const platform2Width = 1000 + 1;
        const p2CenterWidth = platform2Width - (this.edgeLeftWidth + this.edgeRightWidth);
        const p2LeftX = platform2X;
        const p2CenterX = p2LeftX + this.edgeLeftWidth;
        const p2RightX = p2CenterX + p2CenterWidth;

        const p2Left = this.add.sprite(p2LeftX, height - this.floorHeight, 'floor_left').setOrigin(0, 0).setScale(this.leftScaleY);
        const p2Center = this.add.tileSprite(p2CenterX, height - this.floorHeight, p2CenterWidth + 1, this.floorHeight, 'floor').setOrigin(0, 0);
        const p2Right = this.add.sprite(p2RightX, height - this.floorHeight, 'floor_right').setOrigin(0, 0).setScale(this.rightScaleY);
        this.platforms.add(p2Left);
        this.platforms.add(p2Center);
        this.platforms.add(p2Right);

        // 固定のサボテン配置
        const cactusScale = 0.2;
        const originalCactusWidth = this.textures.get('cactus').getSourceImage().width;
        const originalCactusHeight = this.textures.get('cactus').getSourceImage().height;
        const scaledCactusHeight = originalCactusHeight * cactusScale;

        const cactusX = platform2X + this.edgeLeftWidth + 250;
        const cactusY = height - this.floorHeight - scaledCactusHeight + 5;

        const cactusPart = this.add.sprite(cactusX, cactusY, 'cactus').setOrigin(0, 0).setDepth(1).setScale(cactusScale);
        this.physics.add.existing(cactusPart, true);
        this.cacti.add(cactusPart);
        cactusPart.body.updateFromGameObject();

        // サボテンを越えたさらに400px先にゴールフラッグ画像を配置
        this.goalX = cactusX + 400;

        this.goalSprite = this.add.image(this.goalX, height - this.floorHeight + 8, 'goal');
        this.goalSprite.setOrigin(0, 1);
        this.goalSprite.setDepth(5);
        this.goalSprite.setScale(0.3);

        // ------------------------------------------
        // プレイヤーの作成 ＆ 衝突判定
        // ------------------------------------------
        this.player = this.physics.add.sprite(150, height - this.floorHeight - 100, 'player').setScale(0.1);
        this.player.body.setGravityY(gravityY);
        this.player.body.setCollideWorldBounds(false);
        this.player.setDepth(10);

        this.playerCollider = this.physics.add.collider(this.player, this.platforms, this.handleFloorHit, null, this);
        this.physics.add.collider(this.player, this.cacti, this.handleCactusHit, null, this);

        // 入力キーの取得
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI表示（💡 本編のコンパクト仕様に合わせて、高さを80px相当へスリム化）
        const uiX = 20;
        const uiY = 20;
        const uiWidth = 180;
        const uiHeight = 76;   // 💡 110からコンパクトに縮小
        const cornerRadius = 12;

        const uiBackground = this.add.graphics().fillStyle(0x000000, 0.75).fillRoundedRect(uiX, uiY, uiWidth, uiHeight, cornerRadius).setScrollFactor(0).setDepth(100);

        // 💡 【修正】速度表示の文字列を削除し、本編と揃えた「距離」のみの美しいレイアウトへ
        this.uiText = this.add.text(uiX + 15, uiY + 12, '【練習モード】\n距離: 0 m', {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: 'sans-serif',
            lineSpacing: 6
        }).setScrollFactor(0).setDepth(101);

        // 💡 【本編完全移植】スピードバロメーター（独立UIコンポーネント）の作成
        this.speedBarometer = new SpeedBarometer(this, {
            x: 710,         // 画面右上あたり
            y: 85,
            radius: 55,
            maxSpeed: 120,   // maxSpeed(12) × 10 = 120 表示
            depth: 100
        });

        // チュートリアルシーンの初期カウントダウン代わりとして、初期フラグをセット
        this.isTutorialStarting = true;

        this.bgm.play();

        // 画面上部にチュートリアルガイダンスを常駐表示
        this.add.text(width / 2, 50, '二人で協力してゴールを目指そう！', {
            fontSize: '22px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fill: '#ffea00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    // ==========================================
    // 3. 毎フレームの更新処理（ゲームループ）
    // ==========================================
    update() {
        // 開始時ジャンプ暴発完全封殺
        if (this.isTutorialStarting) {
            if (window.m5Data) {
                window.m5Data.isJump = false;
            }
            if (this.player.body.touching.down) {
                this.isTutorialStarting = false;
            }
            return;
        }

        if (this.isGameOverTriggered) return;

        // ゴール達成時は走行入力を受け付けず、バロメーターを0にして静止させる
        if (this.isGoalAchieved) {
            this.scrollSpeed *= this.friction;
            if (this.scrollSpeed < 0.1) this.scrollSpeed = 0;
            this.speedBarometer.update(0); // バロメーターを安全に静止
            this.moveStageElements();
            return;
        }

        // ------------------------------------------
        // 💡 センサー強制ジャンプ制御
        // ------------------------------------------
        if (window.m5Data && window.m5Data.isJump) {
            window.m5Data.isJump = false;
            if (this.player.body.touching.down) {
                this.player.body.setVelocityY(this.jumpPower);
                this.sound.play('se_jump', { volume: 0.5 });
            }
        }

        // 💡 キーボード用のバックアップジャンプ判定
        const isSpaceKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (this.player.body.touching.down && this.canJump && isSpaceKeyDown) {
            this.player.body.setVelocityY(this.jumpPower);
            this.canJump = false;
            this.sound.play('se_jump', { volume: 0.5 });
            this.time.delayedCall(this.jumpCooldown, () => {
                this.canJump = true;
            });
        }

        // ------------------------------------------
        // A. 【漕ぎ・進む速度】の制御（右キー優先化 ＆ ブレーキ連動）
        // ------------------------------------------
        if (this.cursors.right.isDown) {
            this.scrollSpeed += this.acceleration;
        }
        else if (window.m5Data && window.m5Data.isBrake) {
            this.scrollSpeed *= 0.98; // 自然な減速（通常の摩擦より少し強め）
            if (this.scrollSpeed < 0.1) this.scrollSpeed = 0;
        }
        else {
            const hasGyroData = window.m5Data && typeof window.m5Data.gyroY === 'number' && !isNaN(window.m5Data.gyroY);

            if (hasGyroData && Math.abs(window.m5Data.gyroY) > 0.05) {
                const gyroValue = Math.abs(window.m5Data.gyroY);
                this.scrollSpeed += gyroValue * 0.001;

                // 漕ぎ始めの初速（0から漕ぎ始めた瞬間に最低速度を保証）
                if (this.scrollSpeed < 5.0) {
                    this.scrollSpeed = 5.0;
                }

                if (this.scrollSpeed > this.maxSpeed) {
                    this.scrollSpeed = this.maxSpeed;
                }
            } else {
                this.scrollSpeed *= this.friction;
                if (this.scrollSpeed < 0.1) this.scrollSpeed = 0;
            }
        }

        this.scrollSpeed = Math.min(this.scrollSpeed, this.maxSpeed);
        this.background.tilePositionX += this.scrollSpeed * 0.2;

        this.distance += this.scrollSpeed * 0.08;

        const displaySpeed = Math.round(this.scrollSpeed * 5);
        const displayDistance = Math.round(this.distance);

        // 💡 【修正】左上テキストの速度表示を完全に削除し、スッキリ距離だけを更新
        this.uiText.setText(`【練習モード】\n距離: ${displayDistance} m`);

        // 💡 【本編完全移植】スピードバロメーターを現在のリアルタイム速度で美しく追従更新
        this.speedBarometer.update(displaySpeed * 2);

        // ステージ固定配置オブジェクトの移動処理へ
        this.moveStageElements();

        // ゴールフラッグ画像の位置をプレイヤーが超えたかチェック
        if (this.goalX <= this.player.x) {
            this.showTutorialClearUI();
        }

        // 穴の底に落ちた時
        if (this.player.y > this.scale.height) {
            this.triggerGameOverAnimation();
            return;
        }
    }

    // 固定アセットを一斉にスクロールさせる関数
    moveStageElements() {
        this.platforms.getChildren().forEach((platform) => {
            platform.x -= this.scrollSpeed;
            platform.body.updateFromGameObject();
        });

        this.cacti.getChildren().forEach((cactus) => {
            cactus.x -= this.scrollSpeed;
            cactus.body.updateFromGameObject();
        });

        this.goalX -= this.scrollSpeed;
        if (this.goalSprite && this.goalSprite.active) {
            this.goalSprite.x = this.goalX;
        }
    }

    // ゴール到達時のクリアUI表示とSTARTボタン配置
    showTutorialClearUI() {
        if (this.isGoalAchieved) return;
        this.isGoalAchieved = true;

        this.bgm.stop();
        this.sound.play('se_goal');

        this.goalSprite.destroy();

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, height * 0.35, 'TUTORIAL CLEAR!', {
            fontSize: '40px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#66ff22',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(20);

        const btnWidth = 220;
        const btnHeight = 54;
        const container = this.add.container(width / 2, height * 0.6);
        container.setDepth(20);

        const shadow = this.add.graphics().fillStyle(0x2b1000, 1).fillRoundedRect(-btnWidth / 2, 0, btnWidth, (btnHeight / 2) + 4, 16);
        container.add(shadow);

        const key = 'btn_bg_tutorial_start';
        if (!this.textures.exists(key)) {
            const texture = this.textures.createCanvas(key, btnWidth, btnHeight);
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
            ctx.lineTo(0, radius); ctx.quadraticCurveTo(0, 0, radius, 0); ctx.closePath(); ctx.fill();
            texture.refresh();
        }

        const btnBgImage = this.add.image(0, 0, key).setOrigin(0.5);
        container.add(btnBgImage);

        const btnText = this.add.text(0, 0, 'START', {
            fontSize: '26px',
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#2b1000',
            strokeThickness: 5
        }).setOrigin(0.5);
        container.add(btnText);

        const offsetX = 113;
        const offsetY = 30;

        const hitX = (-btnWidth / 2) + offsetX;
        const hitY = (-btnHeight / 2) + offsetY;

        btnBgImage.setInteractive(new Phaser.Geom.Rectangle(hitX, hitY, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);
        btnBgImage.input.cursor = 'pointer';

        btnBgImage.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        btnBgImage.on('pointerover', () => { btnBgImage.y = -2; btnText.y = -2; });
        btnBgImage.on('pointerout', () => { btnBgImage.y = 0; btnText.y = 0; });
    }

    // 障害物接触時の処理
    handleCactusHit(player, cactus) {
        this.triggerGameOverAnimation();
    }

    handleFloorHit(player, platform) {
        if (this.isGameOverTriggered || this.isGoalAchieved) return;
        if (player.body.bottom > platform.body.top + 15) {
            this.triggerGameOverAnimation();
        }
    }

    // チュートリアル中もミスしたらマリオ風に落ちてその場でリスタート
    triggerGameOverAnimation() {
        this.isGameOverTriggered = true;
        this.scrollSpeed = 0;
        this.bgm.stop();
        this.sound.play('se_hit');

        this.player.body.setVelocity(0, 0);
        this.player.body.setAcceleration(0, 0);
        this.player.body.setEnable(false);

        this.tweens.add({
            targets: this.player,
            y: this.scale.height * 0.3,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.player,
                    y: this.scale.height + 100,
                    duration: 800,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        this.scene.restart();
                    }
                });
            }
        });

        this.time.delayedCall(600, () => {
            this.sound.play('se_gameover');
        });
    }
}