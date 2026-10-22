# MediStand — IoT Smart Medication Adherence Monitoring System

MediStand is a modern full-stack IoT healthcare application designed to help caregivers manage patient medication schedules and detect physical medicine bottle removal events using an **ESP8266 NodeMCU** and an **HX711 24-bit ADC load cell**.

---

## 🌟 Key Features

- **Authoritative Physical Interaction Tracking:** Accurately classifies weight drops as "Bottle lifted" or "Medication interaction detected" without making unverified pharmaceutical consumption claims.
- **Real-Time Sensor Telemetry:** Live WebSocket stream (via Socket.IO) displaying raw HX711 counts, baseline tare, and weight change deltas.
- **Idempotent Scheduling Engine:** Prevents duplicate reminders across server restarts with composite idempotent occurrence keys.
- **Multi-Channel Alerts:** In-app caregiver alerts, audible alarms, and configurable SMTP email delivery.
- **Full Caregiver Portal:**
  - **Overview:** Summary stats, live primary stand card, today's medication timeline, overdue alerts, and 7-day adherence trends (Recharts).
  - **Patients:** Comprehensive directory with bed assignment, caregiver info, and device mapping.
  - **Medication Schedule:** Time, frequency, reminder lead time (default 15m), and grace window (default 45m).
  - **Bottle Monitoring:** Live telemetry waveform, sensor calibration, and threshold adjustment.
  - **Alerts & Notifications:** Read/unread filtering, delivery status, and retry tracking.
  - **Medication History:** Searchable, filterable audit log with CSV export and clinical disclaimers.
  - **Demo Simulation Bench:** Interactive toolbar to test the end-to-end workflow without hardware connected.

---

## 📁 Project Structure

```
c:\Users\Lqg\Desktop\Medistand\
├── MediStand_.ino                 # Original baseline working Arduino firmware (preserved)
├── firmware/
│   ├── MediStand_WiFi.ino         # Extended ESP8266 firmware with HTTP telemetry & keep-alive
│   └── README.md                  # Wiring table, pinouts, and flashing instructions
├── server/                        # Express + MongoDB backend + Socket.IO
│   ├── src/
│   │   ├── config/                # MongoDB connection & environment
│   │   ├── models/                # Patient, Device, MedicationSchedule, Reminder, Event, Notification
│   │   ├── controllers/           # API controllers
│   │   ├── services/              # Scheduler, Telemetry processor, Notifications, Socket.IO
│   │   ├── routes/                # REST endpoints
│   │   └── server.js              # Server entry point
│   ├── .env                       # Environment variables
│   └── package.json
├── client/                        # React + Vite + TailwindCSS + Lucide + Recharts
│   ├── src/
│   │   ├── api/                   # Axios API service
│   │   ├── components/            # Sidebar, TopNav, BottleCard, StatusBadge, SimulatorBar
│   │   ├── context/               # SocketContext (real-time telemetry and toasts)
│   │   ├── pages/                 # Overview, Patients, Schedule, Monitoring, Alerts, History, Settings
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 🚀 Quick Startup Guide

### 1. Backend Server
```bash
cd server
npm install
npm start
```
- Runs on **`http://localhost:5000`** (or your PC's LAN IP: `http://192.168.0.100:5000`)
- Automatically seeds initial realistic healthcare data on first launch.

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```
- Opens at **`http://localhost:3000`**

---

## 🔌 Hardware Setup (ESP8266 + HX711)

### Wiring
- **HX711 DT** ➔ **D6 (GPIO12)**
- **HX711 SCK** ➔ **D5 (GPIO14)**
- **Buzzer (+)** ➔ **D7 (GPIO13)** *(optional)*
- **LED (+)** ➔ **D2 (GPIO4)** *(optional)*
- **VCC** ➔ **3.3V or 5V (VIN)**, **GND** ➔ **GND**

### Flashing Extended Firmware
1. Open [`firmware/MediStand_WiFi.ino`](firmware/MediStand_WiFi.ino) in Arduino IDE.
2. Update your Wi-Fi credentials (`WIFI_SSID` & `WIFI_PASSWORD`).
3. Verify `SERVER_HOST` is set to your computer's local IP (e.g. `192.168.0.100`).
4. Select board **NodeMCU 1.0 (ESP-12E Module)** and upload.
5. Open Serial Monitor at **115200 baud** to verify connection and live weight packets.
