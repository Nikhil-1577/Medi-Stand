/**
 * MediStand — IoT Smart Medicine Bottle Stand Firmware (ESP8266 + HX711)
 * 
 * Hardware:
 *   - Microcontroller: ESP8266 NodeMCU v1.0
 *   - Load Cell Amplifier: HX711
 *   - DT Pin:  D6 (GPIO12)
 *   - SCK Pin: D5 (GPIO14)
 *   - Buzzer:  D7 (GPIO13) [Optional / Local Alert]
 *   - LED:     D2 (GPIO4)  [Optional / Local Indicator]
 * 
 * Description:
 *   Extends the baseline MediStand firmware to transmit real-time telemetry
 *   and bottle-lift events to the Node.js/Express backend over Wi-Fi.
 *   The original sensor-reading logic, baseline calibration, and threshold
 *   checks are fully preserved.
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "HX711.h"

// --- Pin Definitions (Preserved Baseline) ---
#define HX711_DT D6    // GPIO12
#define HX711_SCK D5   // GPIO14
#define BUZZER D7      // GPIO13
#define LED D2         // GPIO4

// --- Wi-Fi & Backend Server Configuration ---
const char* WIFI_SSID     = "Wifi Name";
const char* WIFI_PASSWORD = "Wifi Password";

// IP address of the machine running the MediStand Node.js server:
const char* SERVER_HOST   = "Ip Address";  // Current PC Wi-Fi Hotspot IP
const int   SERVER_PORT   = 5000;

// Device Credentials (registered in MediStand dashboard):
const char* DEVICE_ID     = "MEDISTAND-001";
const char* DEVICE_API_KEY= "mst_live_key_medistand_001";

// --- Sensor Variables (Preserved Baseline) ---
HX711 scale;
long baseline = 0;
long threshold = 12000;

// State Tracking & Telemetry Timers
bool isBottlePresent = true;
unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // Send heartbeat every 30s
unsigned long lastEventSendTime = 0;
const unsigned long DEBOUNCE_DELAY = 4000;     // 4s debounce between lift/return transitions

void setupWiFi() {
  Serial.println();
  Serial.print("Connecting to Wi-Fi SSID: [");
  Serial.print(WIFI_SSID);
  Serial.println("]");

  WiFi.disconnect(true);
  delay(200);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  // Give up to 20 seconds for initial connection
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] NodeMCU IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection timed out on boot.");
    Serial.printf("[Wi-Fi] Status code: %d (3=CONNECTED, 4=CONNECT_FAILED, 1=NO_SSID_AVAIL, 6=DISCONNECTED)\n", WiFi.status());
    Serial.println("[Wi-Fi] NOTE: If using a phone hotspot, ensure Hotspot Security is set to 'WPA2-Personal' (ESP8266 cannot connect to pure WPA3).");
    Serial.println("[Wi-Fi] Continuing in background reconnect mode...");
  }
}

/**
 * Transmits sensor telemetry and detected bottle state changes to Express backend
 */
void sendTelemetry(long currentRaw, long diff, const char* eventType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Wi-Fi not connected. Skipping packet.");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  String endpoint = "http://" + String(SERVER_HOST) + ":" + String(SERVER_PORT) + 
                    "/api/devices/" + String(DEVICE_ID) + "/telemetry";

  if (http.begin(client, endpoint)) {
    http.setTimeout(3000);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-key", DEVICE_API_KEY);

    // Build JSON payload
    String payload = "{";
    payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"rawValue\":" + String(currentRaw) + ",";
    payload += "\"baseline\":" + String(baseline) + ",";
    payload += "\"difference\":" + String(diff);
    if (eventType != nullptr && strlen(eventType) > 0) {
      payload += ",\"event\":\"" + String(eventType) + "\"";
    }
    payload += "}";

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      Serial.printf("[HTTP] Ingestion response: %d\n", httpCode);
    } else {
      Serial.printf("[HTTP] Error sending telemetry: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);

  digitalWrite(BUZZER, LOW);
  digitalWrite(LED, LOW);

  // Initialize HX711
  scale.begin(HX711_DT, HX711_SCK);

  Serial.println("========================================");
  Serial.println(" MediStand — IoT Smart Medicine Bottle ");
  Serial.println("========================================");

  // Connect to Local Wi-Fi
  setupWiFi();

  Serial.println("Waiting for HX711 load cell ready...");
  while (!scale.is_ready()) {
    delay(100);
  }

  delay(2000);
  // Startup tare baseline reading (Preserved from baseline code)
  baseline = scale.read_average(10);
  Serial.print("Calibrated Baseline: ");
  Serial.println(baseline);

  // Send initial startup registration packet
  sendTelemetry(baseline, 0, "system_boot");

  Serial.println("System Ready & Monitoring Active.");
}

void loop() {
  if (!scale.is_ready()) {
    digitalWrite(BUZZER, LOW);
    digitalWrite(LED, LOW);
    Serial.println("HX711 not ready");
    delay(500);
    return;
  }

  // Read current weight average (Preserved baseline: 5 samples)
  long current = scale.read_average(5);
  long difference = abs(current - baseline);

  Serial.print("Raw: ");
  Serial.print(current);
  Serial.print(" | Baseline: ");
  Serial.print(baseline);
  Serial.print(" | Change: ");
  Serial.println(difference);

  unsigned long now = millis();

  // Local alert indicators (Preserved baseline behavior)
  if (difference > threshold) {
    digitalWrite(BUZZER, HIGH);
    digitalWrite(LED, HIGH);

    // State change: Bottle has been lifted from the stand
    if (isBottlePresent && (now - lastEventSendTime > DEBOUNCE_DELAY)) {
      isBottlePresent = false;
      lastEventSendTime = now;
      Serial.println(">>> EVENT: Bottle Lifted detected! Transmitting to MediStand backend...");
      sendTelemetry(current, difference, "bottle_lifted");
    }
  } else {
    digitalWrite(BUZZER, LOW);
    digitalWrite(LED, LOW);

    // State change: Bottle has been placed back on the stand
    if (!isBottlePresent && (now - lastEventSendTime > DEBOUNCE_DELAY)) {
      isBottlePresent = true;
      lastEventSendTime = now;
      Serial.println(">>> EVENT: Bottle Returned detected! Transmitting to MediStand backend...");
      sendTelemetry(current, difference, "bottle_returned");
    }
  }

  // Periodic Telemetry Heartbeat (Keep-alive watchdog)
  if (now - lastHeartbeatTime > HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = now;
    sendTelemetry(current, difference, "");
  }

  // Non-blocking Wi-Fi retry if disconnected
  static unsigned long lastWiFiRetry = 0;
  if (WiFi.status() != WL_CONNECTED && now - lastWiFiRetry > 4000) {
    lastWiFiRetry = now;
    int st = WiFi.status();
    Serial.printf("[Wi-Fi] Status code: %d (1=SSID_NOT_FOUND, 4=AUTH_OR_WPA3_FAIL, 6=DISCONNECTED). Retrying...\n", st);
    WiFi.reconnect();
  }

  delay(500);
}
