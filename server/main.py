import asyncio
import json
import math  # 💡 合成加速度の平方根（sqrt）を計算するために追加
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

            # 各軸の数値をパース
            x_val = float(parts[1])
            y_val = float(parts[2])
            z_val = float(parts[3])

            latest_data[sensor_type] = {
                "x": x_val,
                "y": y_val,
                "z": z_val,
            }

            # 💡 【ここを修正：加速度データの時だけ3軸合成加速度（大きさ）を計算して出力】
            if sensor_type == "acc":
                # 📐 ベクトルの長さ（合成加速度）を計算 = sqrt(x² + y² + z²)
                total_acc = math.sqrt(x_val**2 + y_val**2 + z_val**2)
                
                # ターミナルに見やすく「大きさ」も並べて出力
                print(f"acc  : x={x_val:6.2f}, y={y_val:6.2f}, z={z_val:6.2f} | ★大きさ(衝撃) = {total_acc:.2f}")
            else:
                # ジャイロデータは従来どおり出力
                print(f"gyro : x={x_val:6.2f}, y={y_val:6.2f}, z={z_val:6.2f}")

        except Exception as e:
            print("Parse Error")
            print(message)
            print(e)

# --------------------------------
# WebSocket
# --------------------------------

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