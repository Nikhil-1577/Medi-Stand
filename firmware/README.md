# MediStand ESP8266 Firmware Guide & Hardware Reference

This directory contains the firmware files and hardware integration documentation for **MediStand**, an IoT-based smart medication adherence system using the ESP8266 NodeMCU and HX711 24-bit ADC load cell amplifier.

---

## 1. Baseline Firmware Inspection (`MediStand_.ino`)

The original working baseline firmware file is located at the project root:
- [`MediStand_.ino`](../MediStand_.ino)

### How the Baseline Firmware Works:
1. **Pin Mapping:**
   - **`HX711 DT`**: Connected to **D6 (GPIO12)**
   - **`HX711 SCK`**: Connected to **D5 (GPIO14)**
   - **`BUZZER`**: Connected to **D7 (GPIO13)**
   - **`LED`**: Connected to **D2 (GPIO4)**
2. **Startup Tare Calibration:**
   - On boot (`setup()`), the firmware waits for the HX711 sensor to become ready (`scale.is_ready()`).
   - It captures 10 readings (`scale.read_average(10)`) to establish an initial `baseline`.
3. **Weight Deviation Detection:**
   - In the `loop()`, every 500ms it reads an average of 5 samples (`scale.read_average(5)`).
   - It computes `difference = abs(current - baseline)`.
   - If `difference > threshold` (provisional 12,000 raw counts), it sets Buzzer (`D7`) and LED (`D2`) to `HIGH`. Otherwise, it turns them `LOW`.
4. **Current Limitations of Baseline Code:**
   - Operates in standalone isolation with no network connectivity.
   - Does not transmit telemetry or timestamped events to caregivers.
   - Any weight disturbance (touch, vibration, or lift) toggles the buzzer identically without associating with a scheduled medication window.

---

## 2. Extended Wi-Fi Firmware (`MediStand_WiFi.ino`)

The enhanced firmware file is located at:
- [`MediStand_WiFi.ino`](./MediStand_WiFi.ino)

### Proposed Non-Destructive Enhancements:
1. **Preserved Sensor Integrity:**
   - Retains the exact same HX711 pin assignments (`D6` / `D5`), buzzer (`D7`), and LED (`D2`).
   - Retains the startup baseline calibration (`scale.read_average(10)`).
   - Retains the local buzzer and LED activation when `difference > 12000`.
2. **Wi-Fi Connectivity (`ESP8266WiFi`):**
   - Connects to your local Wi-Fi router in station mode (`WIFI_STA`).
   - Non-blocking setup: if Wi-Fi is temporarily disconnected, local sensor reading continues uninterrupted.
3. **Authoritative HTTP POST Telemetry:**
   - Dispatches structured JSON packets to the Express backend endpoint:
     `POST http://<SERVER_HOST>:5000/api/devices/MEDISTAND-001/telemetry`
   - Includes header `x-device-key` for per-device authentication.
4. **State Transition & Debounce Engine:**
   - Detects state transitions: **Bottle Lifted** vs **Bottle Returned**.
   - Enforces a 4-second debounce timer to prevent sensor jitter from flooding the server with duplicate events.
5. **Keep-Alive Heartbeat:**
   - Sends a periodic telemetry sample every 30 seconds so the caregiver dashboard shows the device as **Online** with an active communication timestamp.

---

## 3. Hardware Wiring Table

| Component | NodeMCU Pin | ESP8266 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **HX711 VCC** | 3.3V or 5V (VIN) | — | Power Supply |
| **HX711 GND** | GND | — | Ground |
| **HX711 DT** | **D6** | GPIO12 | Serial Data Line |
| **HX711 SCK** | **D5** | GPIO14 | Power Down and Serial Clock |
| **Piezo Buzzer (+)** | **D7** | GPIO13 | Audible Local Alarm (Optional) |
| **LED Anode (+)** | **D2** | GPIO4 | Visual Indicator (Optional) |
| **Buzzer / LED (-)**| GND | — | Common Ground |

---

## 4. How to Flash the Firmware via Arduino IDE

1. Open Arduino IDE.
2. In **Tools > Board > ESP8266 Boards**, select **NodeMCU 1.0 (ESP-12E Module)**.
3. Install required libraries via **Sketch > Include Library > Manage Libraries**:
   - `HX711` by Bogdan Necula (v0.7.5 or higher).
4. Open [`MediStand_WiFi.ino`](./MediStand_WiFi.ino).
5. Modify lines 30–36 with your network configuration:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* SERVER_HOST   = "192.168.1.50"; // IP address of computer running MediStand backend
   const int   SERVER_PORT   = 5000;
   ```
6. Connect NodeMCU via USB and select the COM port.
7. Click **Upload**.
8. Open **Serial Monitor** at **115200 baud** to view Wi-Fi connection and live raw weight readings.

---

## 5. Rollback to Original Working Code

If you ever wish to test or revert back to the original baseline firmware:
1. Open [`MediStand_.ino`](../MediStand_.ino) in Arduino IDE.
2. Click **Upload**.
3. The board will revert to standalone local reading with zero Wi-Fi dependencies.
