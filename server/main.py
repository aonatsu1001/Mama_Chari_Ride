import asyncio
import json
import socket

import websockets

# --------------------------------
# 設定
# --------------------------------

UDP_PORT = 5000
WS_PORT = 8765

# --------------------------------
# 最新センサデータ
# --------------------------------

latest_data = {"gyro": None, "acc": None}

# --------------------------------
# UDP受信ソケット
# --------------------------------

udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_socket.bind(("0.0.0.0", UDP_PORT))
udp_socket.setblocking(False)

# --------------------------------
# UDP受信処理
# --------------------------------

async def udp_receiver():
    loop = asyncio.get_running_loop()
    print(f"UDP Listening : {UDP_PORT}")

    while True:
        data, addr = await loop.sock_recvfrom(udp_socket, 1024)
        message = data.decode().strip()

        try:
            parts = message.split(",")
            sensor_type = parts[0]

            if sensor_type not in ["gyro", "acc"]:
                continue

            latest_data[sensor_type] = {
                "x": float(parts[1]),
                "y": float(parts[2]),
                "z": float(parts[3]),
            }

            print(f"{sensor_type}: {latest_data[sensor_type]}")

        except Exception as e:
            print("Parse Error")
            print(message)
            print(e)

# --------------------------------
# WebSocket
# --------------------------------

# 💡 【ここを修正】引数を (websocket, path) から最新仕様の (websocket) のみに変更
async def websocket_handler(websocket):
    print("Browser Connected")

    try:
        while True:
            await websocket.send(json.dumps(latest_data))
            await asyncio.sleep(0.02)  # 50Hz

    except Exception:
        print("Browser Disconnected")

# --------------------------------
# メイン
# --------------------------------

async def main():
    ws_server = await websockets.serve(websocket_handler, "0.0.0.0", WS_PORT)
    print(f"WebSocket Server : {WS_PORT}")
    await asyncio.gather(udp_receiver(), ws_server.wait_closed())

if __name__ == "__main__":
    asyncio.run(main())