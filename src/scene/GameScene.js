import SpeedBarometer from '../ui/SpeedBarometer.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
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

        // サボテンのアセットを読み込み
        this.load.image('cactus', 'assets/cactus.png');

        // サウンド：音声ファイルの事前読み込み
        this.load.audio('bgm', 'assets/bgm/bgm.mp3');
        this.load.audio('se_countdown', 'assets/se/countdown.mp3');
        this.load.audio('se_go', 'assets/se/go.mp3');
        this.load.audio('se_jump', 'assets/se/jump.mp3');
        this.load.audio('se_hit', 'assets/se/hit.mp3');
        this.load.audio('se_gameover', 'assets/se/gameover.mp3');

        // 100mごとに再生する応援ボイスのロード
        this.load.audio('voice_terada', 'assets/se/voice_terada.mp3');
        this.load.audio('voice_ohnishi', 'assets/se/voice_ohnishi.mp3');
    }

    // ==========================================
    // 2. ゲーム画面の初期化・オブジェクトの配置
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

        // 物理パラメータの初期値設定
        this.maxSpeed = 9;                // 最大速度 6 を完全維持
        this.jumpPower = -780;
        const gravityY = 1800;

        this.scrollSpeed = 0;
        this.acceleration = 0.05;

        // 滑り改善の固定パラメータ（ブレーキ強化）
        this.friction = 0.92;

        this.canJump = true;
        this.jumpCooldown = 300;

        // 2連暴発防止用のタイマーロック
        this.isSensorJumpLocked = false;

        // UI実装：進んだ距離を管理する変数を初期化
        this.distance = 0;

        // 100mごとのイベント用設定
        this.nextMilestone = 100;
        this.cheerVoices = ['voice_terada', 'voice_ohnishi'];

        // 初期フラグの追加・変更
        this.isCountingDown = true;
        this.isReadyToCount = false;
        this.countdownValue = 3;

        // 床（足場）＆ 障害物（サボテン）の管理グループ作成
        this.platforms = this.physics.add.staticGroup();
        this.cacti = this.physics.add.staticGroup();

        // 初期の床を1枚布として敷き詰める（20m付近の切れ目バグ修正版）
        const startFloorWidth = width;
        const startPart = this.add.tileSprite(0, height - this.floorHeight, startFloorWidth + 1, this.floorHeight, 'floor');
        startPart.setOrigin(0, 0);
        this.platforms.add(startPart);

        this.nextPlatformX = width;

        // ------------------------------------------
        // プレイヤー（キャラクター）の作成
        // ------------------------------------------
        this.player = this.physics.add.sprite(150, height - this.floorHeight - 100, 'player');

        this.player.setScale(0.1);
        this.player.body.setGravityY(gravityY);
        this.player.body.setCollideWorldBounds(false);

        // プレイヤーを床より手前（Depth: 10）に表示
        this.player.setDepth(10);

        // 衝突判定の設定
        this.playerCollider = this.physics.add.collider(this.player, this.platforms, this.handleFloorHit, null, this);
        this.physics.add.collider(this.player, this.cacti, this.handleCactusHit, null, this);

        // デバッグ用入力（キーボード）の取得
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI実装：角角の黒背景とテキストを配置（💡 速度テキスト削除に伴い、少しコンパクトに高さを調整）
        const uiX = 20;
        const uiY = 20;
        const uiWidth = 180;
        const uiHeight = 50; // 💡 80から50に縮小してスタイリッシュに
        const cornerRadius = 12;

        const uiBackground = this.add.graphics();
        uiBackground.fillStyle(0x000000, 0.75);
        uiBackground.fillRoundedRect(uiX, uiY, uiWidth, uiHeight, cornerRadius);
        uiBackground.setScrollFactor(0);

        // 💡 初期テキストを「距離: 0 m」のみに修正
        this.uiText = this.add.text(uiX + 15, uiY + 12, '距離: 0 m', {
            fontSize: '22px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: 'sans-serif',
            lineSpacing: 6
        });
        this.uiText.setScrollFactor(0);

        // UI関連を最手前に持ってくる（Depth: 100以上）
        uiBackground.setDepth(100);
        this.uiText.setDepth(101);

        // カウントダウン：画面中央のテキスト配置
        this.countdownText = this.add.text(width / 2, height / 2, '', {
            fontSize: '80px',
            fontStyle: 'bold',
            fill: '#ff9100',
            fontFamily: 'sans-serif',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.countdownText.setScrollFactor(0);
        this.countdownText.setDepth(102);

        // スピードバロメーター（独立UIコンポーネント）の作成
        this.speedBarometer = new SpeedBarometer(this, {
            x: 710,         // 画面右上あたり
            y: 85,
            radius: 55,
            maxSpeed: 100,   // this.maxSpeed(6) × 5 = 30 km/h 表示
            depth: 100
        });

        this.isGameOverTriggered = false;
    }

    // カウントダウンを実際に開始する関数
    startCountdownSequence() {
        this.isReadyToCount = true;
        this.countdownText.setText('3');
        this.sound.play('se_countdown', { volume: 0.5 });

        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateCountdown,
            callbackScope: this,
            loop: true
        });
    }

    // カウントダウン：1秒ごとに実行される関数
    updateCountdown() {
        this.countdownValue--;

        if (this.countdownValue > 0) {
            this.countdownText.setText(this.countdownValue.toString());
            this.sound.play('se_countdown', { volume: 0.5 });
        } else if (this.countdownValue === 0) {
            this.countdownText.setText('GO!');
            this.countdownText.setFill('#ff0000dd');
            this.sound.play('se_go', { volume: 0.5 });
        } else {
            this.countdownText.destroy();
            this.countdownTimer.destroy();
            this.isCountingDown = false;
            this.bgm.play();
        }
    }

    // ==========================================
    // 3. 毎フレームの更新処理（ゲームループ）
    // ==========================================
    update() {
        // カウントダウン中は、蓄積されるセンサーのジャンプフラグを毎フレーム「最優先で強制リセット破棄」します。
        if (this.isCountingDown && window.m5Data) {
            window.m5Data.isJump = false;
        }

        // 着地前、およびカウントダウン・ゲームオーバー中は処理を完全に遮断（フライング加算バグ修正版）
        if (this.isCountingDown || this.isGameOverTriggered) {
            if (!this.isReadyToCount && this.player.body.touching.down) {
                this.isReadyToCount = true;
                this.time.delayedCall(500, () => {
                    this.startCountdownSequence();
                });
            }
            return;
        }

        const height = this.scale.height;

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

        if (this.distance >= this.nextMilestone) {
            const randomIndex = Math.floor(Math.random() * this.cheerVoices.length);
            const selectedVoice = this.cheerVoices[randomIndex];
            this.sound.play(selectedVoice, { volume: 1.2 });
            this.nextMilestone += 100;
        }

        const displaySpeed = Math.round(this.scrollSpeed * 5);
        const displayDistance = Math.round(this.distance);

        // 💡 【大修正】「速度: XX km/h」のテキスト表示処理を完全カットし、距離のみを美しく出力
        this.uiText.setText(`距離: ${displayDistance} m`);

        // スピードバロメーターの更新（メーターへのデータ送信は継続し、グラフィカルに速度を表現）
        this.speedBarometer.update(displaySpeed * 2);

        // B-1. 床の移動とランダム生成
        this.platforms.getChildren().forEach((platform) => {
            platform.x -= this.scrollSpeed;
            platform.body.updateFromGameObject();

            if (platform.x + platform.displayWidth < 0) {
                this.platforms.killAndHide(platform);
                platform.destroy();
            }
        });

        this.cacti.getChildren().forEach((cactus) => {
            cactus.x -= this.scrollSpeed;
            cactus.body.updateFromGameObject();

            if (cactus.x + cactus.displayWidth < 0) {
                this.cacti.killAndHide(cactus);
                cactus.destroy();
            }
        });

        this.nextPlatformX -= this.scrollSpeed;

        if (this.nextPlatformX < this.scale.width) {
            const maxDifficultyDistance = 1000;
            const difficulty = Math.min(1.0, this.distance / maxDifficultyDistance);

            const minHole = 80 + (60 * difficulty);
            const maxHole = 120 + (40 * difficulty);
            const holeWidth = Phaser.Math.Between(minHole, maxHole);

            const minPlatform = 400 - (100 * difficulty);
            const maxPlatform = 600 - (100 * difficulty);
            const totalPlatformWidth = Phaser.Math.Between(minPlatform, maxPlatform);

            const isHoleSpawn = Phaser.Math.Between(1, 100) <= 60;
            const spawnY = height - this.floorHeight;

            if (isHoleSpawn) {
                const currentLastX = Math.round(this.nextPlatformX);
                const rightEdgePart = this.add.sprite(currentLastX, spawnY, 'floor_right').setOrigin(0, 0).setScale(this.rightScaleY);
                this.platforms.add(rightEdgePart);

                const spawnX = currentLastX + holeWidth + this.edgeRightWidth;

                // 新しい床の始まり（左端アセット）
                const leftPart = this.add.sprite(spawnX, spawnY, 'floor_left').setOrigin(0, 0).setScale(this.leftScaleY);
                this.platforms.add(leftPart);

                // 中央床の幅を計算
                let centerWidth = totalPlatformWidth - this.edgeLeftWidth;

                // ジャンプする必要のない極小の床の生成を禁止
                if (centerWidth < 150) {
                    centerWidth = 150;
                }

                // 中央床の描画
                const centerX = spawnX + this.edgeLeftWidth;
                const centerPart = this.add.tileSprite(centerX, spawnY, centerWidth + 1, this.floorHeight, 'floor').setOrigin(0, 0);
                this.platforms.add(centerPart);

                this.nextPlatformX = centerX + centerWidth;

                // サボテンの生成抽選
                if (this.distance > 100) {
                    const cactusProb = 40 + (40 * difficulty);
                    if (Phaser.Math.Between(1, 100) <= cactusProb) {
                        const originalCactusWidth = this.textures.get('cactus').getSourceImage().width;
                        const cactusScale = 0.2;
                        const originalCactusHeight = this.textures.get('cactus').getSourceImage().height;
                        const scaledCactusWidth = originalCactusWidth * cactusScale;
                        const scaledCactusHeight = originalCactusHeight * cactusScale;

                        if (centerWidth > scaledCactusWidth + 40) {
                            const cactusY = height - this.floorHeight - scaledCactusHeight + 5;
                            const cactusOffsetX = Phaser.Math.Between(20, centerWidth - scaledCactusWidth - 20);
                            const cactusX = centerX + cactusOffsetX;

                            const cactusPart = this.add.sprite(cactusX, cactusY, 'cactus').setOrigin(0, 0).setDepth(1).setScale(cactusScale);
                            this.physics.add.existing(cactusPart, true);
                            this.cacti.add(cactusPart);
                            cactusPart.body.updateFromGameObject();
                        }
                    }
                }
            } else {
                // 1pxの縦の隙間バグを消滅させるオーバーラップ処理
                const spawnX = Math.round(this.nextPlatformX) - 1;
                const straightFloorWidth = totalPlatformWidth + 1;

                const straightPart = this.add.tileSprite(spawnX, spawnY, straightFloorWidth + 1, this.floorHeight, 'floor').setOrigin(0, 0);
                this.platforms.add(straightPart);

                this.nextPlatformX = spawnX + straightFloorWidth;

                if (this.distance > 100) {
                    const cactusProb = 40 + (40 * difficulty);
                    if (Phaser.Math.Between(1, 100) <= cactusProb) {
                        const originalCactusWidth = this.textures.get('cactus').getSourceImage().width;
                        const cactusScale = 0.2;
                        const originalCactusHeight = this.textures.get('cactus').getSourceImage().height;
                        const scaledCactusWidth = originalCactusWidth * cactusScale;
                        const scaledCactusHeight = originalCactusHeight * cactusScale;

                        if (straightFloorWidth > scaledCactusWidth + 40) {
                            const cactusY = height - this.floorHeight - scaledCactusHeight + 5;
                            const cactusOffsetX = Phaser.Math.Between(40, straightFloorWidth - scaledCactusWidth - 40);
                            const cactusX = spawnX + cactusOffsetX;

                            const cactusPart = this.add.sprite(cactusX, cactusY, 'cactus').setOrigin(0, 0).setDepth(1).setScale(cactusScale);
                            this.physics.add.existing(cactusPart, true);
                            this.cacti.add(cactusPart);
                            cactusPart.body.updateFromGameObject();
                        }
                    }
                }
            }
        }

        if (this.player.y > this.scale.height) {
            this.triggerGameOverAnimation();
            return;
        }
    }

    handleCactusHit(player, cactus) {
        this.triggerGameOverAnimation();
    }

    handleFloorHit(player, platform) {
        if (this.isGameOverTriggered) return;
        if (player.body.bottom > platform.body.top + 15) {
            this.triggerGameOverAnimation();
        }
    }

    triggerGameOverAnimation() {
        if (this.isGameOverTriggered) return;
        this.isGameOverTriggered = true;
        this.scrollSpeed = 0;
        this.bgm.stop();

        this.sound.play('se_hit');

        this.player.body.setVelocity(0, 0);
        this.player.body.setAcceleration(0, 0);
        this.player.body.setEnable(false);

        const targetJumpY = this.scale.height * 0.3;

        this.tweens.add({
            targets: this.player,
            y: targetJumpY,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.player,
                    y: this.scale.height + 100,
                    duration: 800,
                    ease: 'Cubic.easeIn'
                });
            }
        });

        this.time.delayedCall(600, () => {
            this.sound.play('se_gameover', { volume: 0.8 });
        });

        this.locationTimer = this.time.delayedCall(2500, () => {
            this.scene.start('GameOverScene', { distance: this.distance });
        });
    }
}