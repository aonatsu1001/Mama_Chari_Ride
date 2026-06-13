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
    }

    // ==========================================
    // 2. ゲーム画面の初期化・オブジェクトの配置
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 【無限スクロール用】背景のループ配置
        this.background = this.add.tileSprite(0, 0, width, height, 'background');
        this.background.setOrigin(0, 0);

        // ------------------------------------------
        // アセットのサイズに基づくパラメータ計算
        // ------------------------------------------
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

        // ------------------------------------------
        // 物理パラメータの初期値設定（受け継ぎ）
        // ------------------------------------------
        this.maxSpeed = 3;                
        this.jumpPower = -730;            
        const gravityY = 1800;            

        this.scrollSpeed = 0;             
        this.acceleration = 0.5;          
        this.friction = 0.95;             
        this.canJump = true;              
        this.jumpCooldown = 300;          

        // ------------------------------------------
        // 床（足場）の管理グループ作成
        // ------------------------------------------
        this.platforms = this.physics.add.staticGroup();

        // ------------------------------------------
        // 【修正】プレイヤーが最初に降り立つ初期の床システム
        // ------------------------------------------
        // 画面左端(0)から、画面右端の手前（右端アセットの幅を引いた分）まで中央床を敷く
        const startCenterWidth = width - this.edgeRightWidth;
        const startCenterPart = this.add.tileSprite(0, height - this.floorHeight, startCenterWidth + 1, this.floorHeight, 'floor');
        startCenterPart.setOrigin(0, 0);
        this.platforms.add(startCenterPart);

        // 初期の床の右端ぴったりに、縮小した floor_right.png を結合する
        const startRightPart = this.add.sprite(startCenterWidth, height - this.floorHeight, 'floor_right');
        startRightPart.setOrigin(0, 0);
        startRightPart.setScale(this.rightScaleY);
        this.platforms.add(startRightPart);

        // 次の床（ランダム生成）をスタートさせる基準のX座標は、画面右端（width）のまま維持
        this.nextPlatformX = width;

        // ------------------------------------------
        // プレイヤー（キャラクター）の作成
        // ------------------------------------------
        this.player = this.physics.add.sprite(150, height - this.floorHeight - 100, 'player');
        
        this.player.setScale(0.1);
        this.player.body.setGravityY(gravityY);
        this.player.body.setCollideWorldBounds(false); 

        // プレイヤーと床グループの衝突設定
        this.physics.add.collider(this.player, this.platforms);

        // デバッグ用入力の取得
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    // ==========================================
    // 3. 毎フレームの更新処理（ゲームループ）
    // ==========================================
    update() {
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

        // B. 床の移動とランダム生成
        this.platforms.getChildren().forEach((platform) => {
            platform.x = Math.round(platform.x - this.scrollSpeed);
            platform.body.updateFromGameObject(); 

            if (platform.x + platform.displayWidth < 0) {
                this.platforms.killAndHide(platform);
                platform.destroy();
            }
        });

        this.nextPlatformX -= this.scrollSpeed;

        if (this.nextPlatformX < this.scale.width) {
            const holeWidth = Phaser.Math.Between(80, 230);
            const totalPlatformWidth = Phaser.Math.Between(300, 600);

            const spawnX = Math.round(this.nextPlatformX + holeWidth);
            const spawnY = height - this.floorHeight;

            // ① 【左端】floor_left.png
            const leftPart = this.add.sprite(spawnX, spawnY, 'floor_left');
            leftPart.setOrigin(0, 0);
            leftPart.setScale(this.leftScaleY); 
            this.platforms.add(leftPart); 

            // ② 【中央】floor.png
            const centerWidth = totalPlatformWidth - (this.edgeLeftWidth + this.edgeRightWidth);
            const centerX = spawnX + this.edgeLeftWidth;

            const centerPart = this.add.tileSprite(centerX, spawnY, centerWidth + 1, this.floorHeight, 'floor');
            centerPart.setOrigin(0, 0);
            this.platforms.add(centerPart);

            // ③ 【右端】floor_right.png
            const rightX = centerX + centerWidth;
            const rightPart = this.add.sprite(rightX, spawnY, 'floor_right');
            rightPart.setOrigin(0, 0);
            rightPart.setScale(this.rightScaleY); 
            this.platforms.add(rightPart);

            this.nextPlatformX = spawnX + totalPlatformWidth;
        }

        // C. 【ジャンプ】の制御
        const isJumpSensorTriggered = window.m5Data && window.m5Data.isJump === true;
        const isSpaceKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);

        if (this.player.body.touching.down && this.canJump) {
            if (isJumpSensorTriggered || isSpaceKeyDown) {
                this.player.body.setVelocityY(this.jumpPower);
                this.canJump = false;
                this.time.delayedCall(this.jumpCooldown, () => {
                    this.canJump = true;
                });
                if (isJumpSensorTriggered) {
                    window.m5Data.isJump = false;
                }
            }
        }

        // ------------------------------------------
        // D. 【ゲームオーバー判定】正面から壁にぶつかった瞬間、または落下時
        // ------------------------------------------
        // 💡 プレイヤーの右端X座標が地面（左端パーツ）の壁に重なった瞬間、即座に再起動
        if (this.player.body.blocked.right) {
            this.scrollSpeed = 0;
            console.log("GAME OVER: 壁に正面衝突しました！");
            this.scene.restart(); 
            return; // 1コマも進めずにここで処理を終了
        }

        // 念のため、壁に当たらずそのまま真っ逆さまに穴の底に落ちていった場合の安全用判定
        if (this.player.y > this.scale.height) {
            console.log("GAME OVER: 穴の底に落ちました！");
            this.scrollSpeed = 0;
            this.scene.restart(); 
        }
    }
}