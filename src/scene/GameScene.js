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

        // ★★★ サウンド：音声ファイルの事前読み込み ★★★
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
    // ==========================================
    // 2. ゲーム画面の初期化・オブジェクトの配置
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // BGMの準備（まだ再生はしません）
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
        this.maxSpeed = 6;                
        this.jumpPower = -730;            
        const gravityY = 1800;            

        this.scrollSpeed = 0;             
        this.acceleration = 1;          
        this.friction = 0.95;             
        this.canJump = true;              
        this.jumpCooldown = 300;          

        // UI実装：進んだ距離を管理する変数を初期化
        this.distance = 0;

        // 初期フラグの追加・変更
        this.isCountingDown = true; 
        this.isReadyToCount = false; 
        this.countdownValue = 3;

// ------------------------------------------
        // 床（足場）＆ ★障害物（壁）の管理グループ作成
        // ------------------------------------------
        this.platforms = this.physics.add.staticGroup();

        // ★★★ 追加①：壁専用のグループと当たり判定を作る ★★★
        this.obstacles = this.physics.add.staticGroup();

        // （この下の「プレイヤーが最初に降り立つ初期の床システム」はそのまま）
        // ------------------------------------------
        // プレイヤーが最初に降り立つ初期の床システム
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

        // ★★★ 修正：プレイヤーを床より手前（Depth: 10）に表示 ★★★
        this.player.setDepth(10); 

        // 衝突判定の設定
// ★★★ 修正：床との衝突時にも handleFloorHit を呼び出すように変更 ★★★
        this.playerCollider = this.physics.add.collider(this.player, this.platforms, this.handleFloorHit, null, this);

        this.physics.add.collider(this.player, this.obstacles, this.handleWallHit, null, this);

        // デバッグ用入力の取得
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI実装：角丸の黒背景とテキストを配置
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

        // ★★★ 修正：UI関連を最手前に持ってくる（Depth: 100以上） ★★★
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
        this.countdownText.setDepth(102); // 文字も手前に

        this.isGameOverTriggered = false;
    }

    // ★★★ カウントダウンを実際に開始する新しい関数 ★★★
    startCountdownSequence() {
        this.isReadyToCount = true;
        this.countdownText.setText('3'); // 画面に「3」を表示
        this.sound.play('se_countdown'); // 「3」のSEを鳴らす

        // ここで初めて1秒ごとのループタイマーを起動
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateCountdown,
            callbackScope: this,
            loop: true
        });
    }

    // カウントダウン：1秒ごとに実行される関数（中身はそのまま）
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

        // A. 【漕ぎ・進む速度】の制御
        const isPaddleSensorConnected = window.m5Data && window.m5Data.gyroY !== undefined;
        if (isPaddleSensorConnected) {
            const gyroValue = Math.abs(window.m5Data.gyroY); 
            this.scrollSpeed = gyroValue * 0.1;
        } else {
            if (this.cursors.right.isDown) {
                this.scrollSpeed += this.acceleration;
            } else {
                this.scrollSpeed *= this.friction;
                if (this.scrollSpeed < 0.1) this.scrollSpeed = 0;
            }
        }
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

        // ★★★ 追加②：壁（obstacles）もプレイヤーの進行に合わせて左へ移動させる ★★★
        this.obstacles.getChildren().forEach((obstacle) => {
            obstacle.x = Math.round(obstacle.x - this.scrollSpeed);
            obstacle.body.updateFromGameObject(); 

            if (obstacle.x + obstacle.displayWidth < 0) {
                this.obstacles.killAndHide(obstacle);
                obstacle.destroy();
            }
        });

        this.nextPlatformX -= this.scrollSpeed;

// ★★★ 修正③：床に混ざって生成される「独立した壁」 ★★★
        if (this.nextPlatformX < this.scale.width) {
            const holeWidth = Phaser.Math.Between(80, 230);
            const totalPlatformWidth = Phaser.Math.Between(300, 600);

            const spawnX = Math.round(this.nextPlatformX + holeWidth);
            const spawnY = height - this.floorHeight; // 床は常に通常サイズ（112px）で生成

            // ------------------------------------------
            // 常に「平らな通常の床」を生成する
            // ------------------------------------------
            // ① 左端
            const leftPart = this.add.sprite(spawnX, spawnY, 'floor_left');
            leftPart.setOrigin(0, 0);
            leftPart.setScale(this.leftScaleY); 
            this.platforms.add(leftPart); 

            // ② 中央
            const centerWidth = totalPlatformWidth - (this.edgeLeftWidth + this.edgeRightWidth);
            const centerX = spawnX + this.edgeLeftWidth;
            const centerPart = this.add.tileSprite(centerX, spawnY, centerWidth + 1, this.floorHeight, 'floor');
            centerPart.setOrigin(0, 0);
            this.platforms.add(centerPart);

            // ③ 右端
            const rightX = centerX + centerWidth;
            const rightPart = this.add.sprite(rightX, spawnY, 'floor_right');
            rightPart.setOrigin(0, 0);
            rightPart.setScale(this.rightScaleY); 
            this.platforms.add(rightPart);

            // ------------------------------------------
            // ★ 今回の肝：通常の床の上に、ポンッと壁を置く ★
            // ------------------------------------------
            // 確率50%で壁を配置
            const isWall = Phaser.Math.Between(1, 100) <= 50;

            if (isWall) {
                // 画像の幅を取得して、壁が穴にはみ出さないか計算
                const wallWidth = this.textures.get('wall').getSourceImage().width;

                // 床の幅（centerWidth）が、壁を置くのに十分な広さがある時だけ生成する
                if (centerWidth > wallWidth + 100) {
                    const wallHeight = 199; 
                    const wallY = height - wallHeight; // 画面底から生やす

                    // 床の中央部分のどこかに、ランダムで壁を配置する
                    const wallOffsetX = Phaser.Math.Between(50, centerWidth - wallWidth - 50);
                    const wallX = centerX + wallOffsetX;

                    // ★★★ すり抜けバグ修正箇所 ★★★
                    // obstaclesグループの create メソッドを使って生成します
                    const wallPart = this.obstacles.create(wallX, wallY, 'wall');
                    wallPart.setOrigin(0, 0);
                    wallPart.setDepth(1); 
                    
                    // 【超重要】基準点(Origin)を変えた後は、必ず refreshBody() を呼ぶ！
                    // これがないと、見た目と当たり判定がズレてしまい「すり抜け」が発生します。
                    wallPart.refreshBody(); 
                }
            }

            this.nextPlatformX = spawnX + totalPlatformWidth;
        }

        // C. 【ジャンプ】の制御
        const isJumpSensorTriggered = window.m5Data && window.m5Data.isJump === true;
        const isSpaceKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);

        if (this.player.body.touching.down && this.canJump) {
            if (isJumpSensorTriggered || isSpaceKeyDown) {
                this.player.body.setVelocityY(this.jumpPower);
                this.canJump = false;
                this.sound.play('se_jump');

                this.time.delayedCall(this.jumpCooldown, () => {
                    this.canJump = true;
                });
                if (isJumpSensorTriggered) {
                    window.m5Data.isJump = false;
                }
            }
        }

        // 💡 穴の底に落ちた時の最終セーフティ判定
        if (this.player.y > this.scale.height) {
            this.triggerGameOverAnimation();
            return;
        }
    }

// ★★★ 新しく追加：壁にぶつかった瞬間に物理エンジンから呼ばれる関数 ★★★
    handleWallHit(player, wall) {
        // すでにゲームオーバー中なら何もしない
        if (this.isGameOverTriggered) return;

        // ★★★ 激突判定の最強ロジック ★★★
        // プレイヤーの足元（bottom）が、壁の上面（top）より下にある場合のみゲームオーバー！
        // これにより、上手にジャンプして「壁の上」に乗った場合はセーフになります。
        // （+15 は、壁の角にギリギリ足が引っかかった時をセーフにするための「遊び」です）
        if (player.body.bottom > wall.body.top + 15) {
            this.triggerGameOverAnimation();
        }
    }

// ★★★ 修正版：床の側面に激突した瞬間に呼ばれる関数 ★★★
    handleFloorHit(player, platform) {
        // すでにゲームオーバー中なら何もしない
        if (this.isGameOverTriggered) return;

        // ★★★ touching.right の条件を削除！ ★★★
        // プレイヤーが床と物理的に接触した時点でこの関数が呼ばれます。
        // その際、プレイヤーの足元（bottom）が床の上面（top）より確実に下（+15px）にあるなら、
        // それは「上に乗っている」のではなく「側面にぶつかっている」ことになります。
        if (player.body.bottom > platform.body.top + 15) {
            this.triggerGameOverAnimation();
        }
    }

// ★★★ マリオ風ゲームオーバー演出（めり込み防止・絶対座標ジャンプ版） ★★★
    triggerGameOverAnimation() {
        this.isGameOverTriggered = true; 
        this.scrollSpeed = 0;            // スクロール（背景や床の移動）を完全に止める
        this.bgm.stop();                 // BGMを止める

        // 1. まず、壁にぶつかった「ドンッ！」というヒット音を即座に鳴らす
        this.sound.play('se_hit');

        // ★★★ 解決策②：めり込み防止 ★★★
        // 物理をオフにする前に、プレイヤーの移動速度（X軸・Y軸両方）を完全に【0】にします。
        // これにより、慣性で壁や床に突き進むのを防ぎ、ぶつかったその場でピタッと固定されます。
        this.player.body.setVelocity(0, 0);
        this.player.body.setAcceleration(0, 0);

        // 物理演算そのものを完全に停止（スリープ）させ、すり抜け状態にする
        this.player.body.setEnable(false);

        // ★★★ 解決策③：絶対座標への大きな飛び上がり演出 ★★★
        // 画面の高さ（this.scale.height）を基準に、どの床の位置からでも
        // 画面の「上から3割」くらいの高さ（例: 450px中、上から135px付近）までダイナミックに跳ね上げます。
        const targetJumpY = this.scale.height * 0.3; 

        // 2-A. 0.4秒かけて、画面上部の一定の高さ（targetJumpY）までしっかり飛び上がらせる
        this.tweens.add({
            targets: this.player,
            y: targetJumpY,        // 指定した絶対座標（高さ）まで移動
            duration: 400,         // 滞空時間を少し感じるよう0.4秒に調整
            ease: 'Cubic.easeOut', // 頂点に向けて滑らかに減速（綺麗なジャンプに）
            onComplete: () => {
                // 2-B. 頂点に達したら、0.8秒かけて画面外（底）へ真っ逆さまに落とす
                this.tweens.add({
                    targets: this.player,
                    y: this.scale.height + 100,
                    duration: 800,
                    ease: 'Cubic.easeIn' // 落ちるにつれて加速（リアルな重力感に）
                });
            }
        });

        // ★★★ 解決策①：SEの間隔を空ける ★★★
        // ヒット音が鳴ってから【0.6秒（600ミリ秒）】遅らせてゲームオーバーメロディを再生します。
        // ドンッ！という衝撃の余韻のあとに切ない音が流れ出すので、メリハリが生まれます。
        this.time.delayedCall(600, () => {
            this.sound.play('se_gameover');
        });

        // 4. 演出のトータル時間に合わせ、画面遷移のディレイも調整（2.5秒 = 2500ミリ秒）
        // 音が鳴り終わり、プレイヤーが画面外に完全に消え去った絶妙なタイミングで切り替えます。
        this.time.delayedCall(2500, () => {
            this.scene.start('GameOverScene', { distance: this.distance }); 
        });
    }
}