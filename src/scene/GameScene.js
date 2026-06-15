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
        this.load.image('wall', 'assets/wall.png');

        // サウンド：音声ファイルの事前読み込み
        this.load.audio('bgm', 'assets/bgm/bgm.mp3');
        this.load.audio('se_countdown', 'assets/se/countdown.mp3');
        this.load.audio('se_go', 'assets/se/go.mp3');
        this.load.audio('se_jump', 'assets/se/jump.mp3');
        this.load.audio('se_hit', 'assets/se/hit.mp3');
        this.load.audio('se_gameover', 'assets/se/gameover.mp3');
    }

    // ==========================================
    // 2. ゲーム画面の初期化・オブジェクトの配置
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // BGMの準備
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });

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
        this.maxSpeed = 3;                
        this.jumpPower = -730;            
        const gravityY = 1800;            

        this.scrollSpeed = 0;             
        this.acceleration = 0.2; // ➔ キーボード操作で加速が自然になるように調整         
        this.friction = 0.98;    // ➔ キーボードを離した時に滑らかに減速するように調整         
        this.canJump = true;              
        this.jumpCooldown = 300;          

        // UI実装：進んだ距離を管理する変数を初期化
        this.distance = 0;

        // 初期フラグの追加・変更
        this.isCountingDown = true; 
        this.isReadyToCount = false; 
        this.countdownValue = 3;

        // ------------------------------------------
        // 床（足場）＆ 障害物（壁）の管理グループ作成
        // ------------------------------------------
        this.platforms = this.physics.add.staticGroup();
        this.obstacles = this.physics.add.staticGroup();

        // ------------------------------------------
        // プレイヤーが最初に降り立つ初期的システム
        // ------------------------------------------
        const startCenterWidth = width - this.edgeRightWidth;
        const startCenterPart = this.add.tileSprite(0, height - this.floorHeight, startCenterWidth + 1, this.floorHeight, 'floor');
        startCenterPart.setOrigin(0, 0);
        this.platforms.add(startCenterPart);

        const startRightPart = this.add.sprite(startCenterWidth, height - this.floorHeight, 'floor_right');
        startRightPart.setOrigin(0, 0);
        startRightPart.setScale(this.rightScaleY);
        this.platforms.add(startRightPart);

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
        this.physics.add.collider(this.player, this.obstacles, this.handleWallHit, null, this);

        // デバッグ用入力（キーボード）の取得
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI実装：角角の黒背景とテキストを配置
        const uiX = 20;   
        const uiY = 20;   
        const uiWidth = 180;  
        const uiHeight = 80;  
        const cornerRadius = 12; 

        const uiBackground = this.add.graphics();
        uiBackground.fillStyle(0x000000, 0.75); 
        uiBackground.fillRoundedRect(uiX, uiY, uiWidth, uiHeight, cornerRadius);
        uiBackground.setScrollFactor(0); 

        this.uiText = this.add.text(uiX + 15, uiY + 12, '速度: 0 km/h\n距離: 0 m', {
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

        this.isGameOverTriggered = false;
    }

    // カウントダウンを実際に開始する関数
    startCountdownSequence() {
        this.isReadyToCount = true;
        this.countdownText.setText('3'); 
        this.sound.play('se_countdown'); 

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
            this.sound.play('se_countdown');
        } else if (this.countdownValue === 0) {
            this.countdownText.setText('GO!');
            this.countdownText.setFill('#ff0000dd'); 
            this.sound.play('se_go');
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
        // 着地前、またはカウントダウン・ゲームオーバー演出中は処理を遮断
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
        // A. 【漕ぎ・進む速度】の制御（空中センサー遮断ハイブリッド仕様）
        // ------------------------------------------
        // 💡 1. デバッグ操作（→キーが押されている場合）は最優先で強制加速
        if (this.cursors.right.isDown) {
            this.scrollSpeed += this.acceleration;
        } 
        // 💡 2. 右キーが押されておらず、【かつプレイヤーが地面に着地している】ときのみセンサー値を反映
        else {
            const hasGyroData = window.m5Data && typeof window.m5Data.gyroY === 'number' && !isNaN(window.m5Data.gyroY);
            const isPlayerOnGround = this.player.body.touching.down;

            // 着地中であり、かつ有効なセンサー値が一定以上振られている場合のみ漕ぎを許可
            if (isPlayerOnGround && hasGyroData && Math.abs(window.m5Data.gyroY) > 0.05) {
                const gyroValue = Math.abs(window.m5Data.gyroY); 
                this.scrollSpeed = gyroValue * 0.1;
            } else {
                // 💡 3. 空中にいるとき、またはセンサーが振られていないときは摩擦で自然減速
                this.scrollSpeed *= this.friction;
                if (this.scrollSpeed < 0.1) this.scrollSpeed = 0;
            }
        }
        
        // 共通制限：最高速度の枠を超えないようにロックし、背景を動かす
        this.scrollSpeed = Math.min(this.scrollSpeed, this.maxSpeed);
        this.background.tilePositionX += this.scrollSpeed * 0.2; 

        // UI実装：進んだ距離を更新する
        this.distance += this.scrollSpeed * 0.05;

        // UI実装：画面上のテキスト表示をリアルタイムに書き換える
        const displaySpeed = Math.round(this.scrollSpeed * 5);
        const displayDistance = Math.round(this.distance);
        this.uiText.setText(`速度: ${displaySpeed} km/h\n距離: ${displayDistance} m`);

        // B-1. 床の移動とランダム生成
        this.platforms.getChildren().forEach((platform) => {
            platform.x = Math.round(platform.x - this.scrollSpeed);
            platform.body.updateFromGameObject(); 

            if (platform.x + platform.displayWidth < 0) {
                this.platforms.killAndHide(platform);
                platform.destroy();
            }
        });

        // 壁（obstacles）もプレイヤーの進行に合わせて左へ移動させる
        this.obstacles.getChildren().forEach((obstacle) => {
            obstacle.x = Math.round(obstacle.x - this.scrollSpeed);
            obstacle.body.updateFromGameObject(); 

            if (obstacle.x + obstacle.displayWidth < 0) {
                this.obstacles.killAndHide(obstacle);
                obstacle.destroy();
            }
        });

        this.nextPlatformX -= this.scrollSpeed;

        // 難易度変化＋床に混ざる「独立した壁」
        if (this.nextPlatformX < this.scale.width) {
            const maxDifficultyDistance = 1000;
            const difficulty = Math.min(1.0, this.distance / maxDifficultyDistance);

            const minHole = 80 + (100 * difficulty);
            const maxHole = 230 + (40 * difficulty);
            const holeWidth = Phaser.Math.Between(minHole, maxHole);

            const minPlatform = 400 - (100 * difficulty);
            const maxPlatform = 600 - (100 * difficulty);
            const totalPlatformWidth = Phaser.Math.Between(minPlatform, maxPlatform);

            const spawnX = Math.round(this.nextPlatformX + holeWidth);
            const spawnY = height - this.floorHeight; 

            // ① 左端床
            const leftPart = this.add.sprite(spawnX, spawnY, 'floor_left');
            leftPart.setOrigin(0, 0);
            leftPart.setScale(this.leftScaleY); 
            this.platforms.add(leftPart); 

            // ② 中央床
            const centerWidth = totalPlatformWidth - (this.edgeLeftWidth + this.edgeRightWidth);
            const centerX = spawnX + this.edgeLeftWidth;
            const centerPart = this.add.tileSprite(centerX, spawnY, centerWidth + 1, this.floorHeight, 'floor');
            centerPart.setOrigin(0, 0);
            this.platforms.add(centerPart);

            // ③ 右端床
            const rightX = centerX + centerWidth;
            const rightPart = this.add.sprite(rightX, spawnY, 'floor_right');
            rightPart.setOrigin(0, 0);
            rightPart.setScale(this.rightScaleY); 
            this.platforms.add(rightPart);

            // 壁のランダム生成判定
            const wallProb = 50 + (50 * difficulty);
            const isWall = Phaser.Math.Between(1, 100) <= wallProb;

            if (isWall) {
                const wallWidth = this.textures.get('wall').getSourceImage().width;

                if (centerWidth > wallWidth + 40) {
                    const wallHeight = 199; 
                    const wallY = height - wallHeight;

                    const wallOffsetX = Phaser.Math.Between(20, centerWidth - wallWidth - 20);
                    const wallX = centerX + wallOffsetX;

                    const wallPart = this.add.sprite(wallX, wallY, 'wall');
                    wallPart.setOrigin(0, 0);
                    wallPart.setDepth(1); 

                    this.physics.add.existing(wallPart, true);
                    this.obstacles.add(wallPart); 
                }
            }

            this.nextPlatformX = spawnX + totalPlatformWidth;
        }

        // ------------------------------------------
        // C. 【ジャンプ】の制御（センサ ＆ Spaceキー入力併用デバッグ仕様）
        // ------------------------------------------
        const isJumpSensorTriggered = window.m5Data && window.m5Data.isJump === true;
        const isSpaceKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);

        // プレイヤーが現在、床（足場）にしっかりと乗っている時だけジャンプ許可
        if (this.player.body.touching.down && this.canJump) {
            if (isJumpSensorTriggered || isSpaceKeyDown) {
                // 上方向（負のY値）へ物理速度を一気に適用して跳ね上げ
                this.player.body.setVelocityY(this.jumpPower);
                this.canJump = false;
                this.sound.play('se_jump');

                // 連続連打ジャンプを防ぐためのディレイ
                this.time.delayedCall(this.jumpCooldown, () => {
                    this.canJump = true;
                });
                
                // センサによるジャンプトリガーだった場合は、フラグを安全に消化・リセットする
                if (isJumpSensorTriggered) {
                    window.m5Data.isJump = false;
                }
            }
        }

        // 穴の底に落ちた時の最終セーフティ判定
        if (this.player.y > this.scale.height) {
            this.triggerGameOverAnimation();
            return;
        }
    }

    // 壁にぶつかった瞬間に物理エンジンから呼ばれる関数
    handleWallHit(player, wall) {
        if (this.isGameOverTriggered) return;

        // プレイヤーの足元（bottom）が、壁の上面（top）より下にある場合のみ激突と判定
        if (player.body.bottom > wall.body.top + 15) {
            this.triggerGameOverAnimation();
        }
    }

    // 床の側面に激突した瞬間に呼ばれる関数
    handleFloorHit(player, platform) {
        if (this.isGameOverTriggered) return;

        // プレイヤーの足元が床の上面より確実に下にあるなら、側面激突として処理
        if (player.body.bottom > platform.body.top + 15) {
            this.triggerGameOverAnimation();
        }
    }

    // マリオ風ゲームオーバー演出＆シーン遷移
    triggerGameOverAnimation() {
        this.isGameOverTriggered = true; 
        this.scrollSpeed = 0;            
        this.bgm.stop();                 

        // ヒット音（ドンッ）の再生
        this.sound.play('se_hit');

        // めり込み防止：プレイヤーのベクトル速度を完全停止
        this.player.body.setVelocity(0, 0);
        this.player.body.setAcceleration(0, 0);
        this.player.body.setEnable(false);

        // 絶対座標への大きな跳ね上がり＆落下演出（Tween制御）
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

        // 演出時間を稼いでから、切ないゲームオーバー音を流す
        this.time.delayedCall(600, () => {
            this.sound.play('se_gameover');
        });

        // 全てが終了した段階で、GameOverSceneへ遷移
        this.time.delayedCall(2500, () => {
            this.scene.start('GameOverScene', { distance: this.distance }); 
        });
    }
}