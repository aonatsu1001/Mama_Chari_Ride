#include <M5StickCPlus.h>
#include <WiFi.h>
#include <WiFiUdp.h>

//--------------------------------------------------
// Wi-Fi設定
//--------------------------------------------------
const char* ssid     = "kenko-s2";
const char* password = "teamtsukamoto";

const char* PC_IP = "255.255.255.255";
const int   PC_PORT = 5000;

//--------------------------------------------------
// UDP
//--------------------------------------------------
WiFiUDP udp;

//--------------------------------------------------
// IMU
//--------------------------------------------------
float accX = 0.0F;
float accY = 0.0F;
float accZ = 0.0F;

char buf[100];

const String dev_name = "M5StickCPlus_ACC";


//--------------------------------------------------
// UDP送信
//--------------------------------------------------
void send_udp()
{
    sprintf(
        buf,
        "acc,%5.2f,%5.2f,%5.2f",
        accX,
        accY,
        accZ
    );

    udp.beginPacket(PC_IP, PC_PORT);
    udp.print(buf);
    udp.endPacket();
}

//--------------------------------------------------
// setup
//--------------------------------------------------
void setup()
{
    M5.begin();

    Serial.begin(115200);

    M5.Imu.Init();

    M5.Lcd.setRotation(3);
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextSize(1);

    M5.Lcd.setCursor(60, 15);
    M5.Lcd.println(dev_name);

    M5.Lcd.setCursor(30, 30);
    M5.Lcd.println("  X       Y       Z");

     //Wi-Fi接続
    WiFi.begin(ssid, password);

    M5.Lcd.setCursor(10, 60);
    M5.Lcd.println("Connecting...");

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("WiFi Connected");

    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    M5.Lcd.fillScreen(BLACK);

    M5.Lcd.setCursor(60, 15);
    M5.Lcd.println(dev_name);

    M5.Lcd.setCursor(30, 30);
    M5.Lcd.println("  X       Y       Z");
}

//--------------------------------------------------
// loop
//--------------------------------------------------
void loop()
{
    M5.IMU.getAccelData(
        &accX,
        &accY,
        &accZ
    );

    M5.Lcd.setCursor(30, 40);

    M5.Lcd.printf(
        "%6.2f  %6.2f  %6.2f      ",
        accX,
        accY,
        accZ
    );

    Serial.println(buf);
    send_udp();

    delay(20); // 50Hz
}
