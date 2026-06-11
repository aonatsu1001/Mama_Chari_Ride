export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    // ==========================================
    // 1. 画像・音声などの素材の事前読み込み
    // ==========================================
    preload() {
        this.load.image('background', 'assets/bg.png'); 
        this.load.image('floor', 'assets/floor.png');
        this.load.image('player', 'assets/player.png');
    }

    // ==========================================
    // 2. ゲーム画面の初期化・オブジェクトの配置
    // ==========================================
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 【無限スクロール用】TileSpriteとして背景を配置
        this.background = this.add.tileSprite(0, 0, width, height, 'background');
        this.background.setOrigin(0, 0);

        // ------------------------------------------
        // 地面（床）の配置変更
        // ------------------------------------------
        // 【変更】床の高さ（厚み）を 60px から 150px に引き伸ばします
        const floorHeight = 110; 
        
        // Y座標を「画面全体の高さ - 新しい床の高さ」にすることで、画面最下部ピッタリに配置します
        this.floor = this.add.tileSprite(0, height - floorHeight, width, floorHeight, 'floor');
        this.floor.setOrigin(0, 0);

        // 地面に物理エンジン（Arcade Physics）の静的ボディを適用
        this.physics.add.existing(this.floor, true); 

        // ------------------------------------------
        // プレイヤー（キャラクター）の作成
        // ------------------------------------------
        this.player = this.physics.add.sprite(150, height - 200, 'player');
        this.player.setScale(0.1);

        // プレイヤーの物理設定
        this.player.body.setGravityY(1000);           
        this.player.body.setCollideWorldBounds(true); 

        // プレイヤーと床が衝突して「着地」するように設定
        this.physics.add.collider(this.player, this.floor);

        // ------------------------------------------
        // 速度・ジャンプ制御に関する変数の定義
        // ------------------------------------------
        this.scrollSpeed = 0;       
        this.maxSpeed = 3;         
        this.acceleration = 0.5;    
        this.friction = 0.95;       
        this.jumpPower = -500;      

        this.canJump = true;
        this.jumpCooldown = 300;    

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    // ==========================================
    // 3. 毎フレームの更新処理（ゲームループ）
    // ==========================================
    update() {
        // 漕ぎ制御
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
        this.floor.tilePositionX += this.scrollSpeed;            

        // ジャンプ制御
        const isJumpSensorTriggered = window.m5Data && window.m5Data.isJump === true;
        const isSpaceKeyDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);

        if (this.player.body.blocked.down && this.canJump) {
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
    }
}