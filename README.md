# ママチャリ走（Mama_Chari_Ride）

M5StickC Plus2 のセンサデータ（角速度・加速度）を Python サーバー経由でブラウザに送信し、Phaser 3 で動くゲームを操作する体感型横スクロールアクションゲームです。



https://github.com/user-attachments/assets/6a8a5735-0eb8-4612-b6fa-ea874804c049



---

## 🛠️ デバッグ方法（初回のみ必須）

このリポジトリをクローンした後、各自の PC 環境で以下のセットアップを一度だけ行ってください。

### 1. Node.js の確認とローカルサーバーツールのインストール
ゲーム画面（フロントエンド）をローカル環境で正しく配信するために `http-server` を使用します。

1. PC に **Node.js** がインストールされているか確認します。ターミナル（または PowerShell）で以下を実行し、バージョンが表示されれば OK です。

   node -v

   npm -v

    コマンドがないときはNode.js公式サイトからLTS（推奨版）をインストールし、ターミナルを開き直してください。

2. 以下のコマンドで、グローバルに http-server をインストールします。

    npm install -g http-server

3. ターミナルで server フォルダに移動し、ライブラリをインストールします。

    cd server

    python -m pip install -r requirements.txt

    もし ModuleNotFoundError: No module named 'websockets' などのエラーが出る場合は、実際に実行する Python 環境に直接インストールするため、以下を試してください。

    python -m pip install websockets

### 2. デバッグ手順

1. 新しいターミナルを開き、server フォルダに移動して実行します。

    cd server

    python main.py

2. もう一つ別の新しいターミナルを開きます（Python の画面は閉じずにそのままにしておきます）。以下のコマンドを実行。

    cd src

    npx http-server -p 8080

3. 起動すると画面に以下のURLが表示されるので、Google Chrome などのブラウザでアクセスします。

    http://127.0.0.1:8080



開発段階では，→キーとSpaceキー入力。

コードを変更してもブラウザ上で変化が見られない場合は，Ctrl + F5

