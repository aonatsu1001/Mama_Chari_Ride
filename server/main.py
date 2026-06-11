import asyncio
import websockets

async def handler(websocket, path):
    print("ブラウザが接続しました（M5待ち受け状態）")
    try:
        # 接続を維持するためのループ
        while True:
            await asyncio.sleep(1)
    except websockets.ConnectionClosed:
        print("ブラウザが切断されました")

async def main():
    # ポート番号8765でWebSocketサーバーを起動
    async with websockets.serve(handler, "localhost", 8765):
        print("Python WebSocket Server started on ws://localhost:8765")
        await asyncio.Future() # サーバーを永続起動

if __name__ == "__main__":
    asyncio.run(main())