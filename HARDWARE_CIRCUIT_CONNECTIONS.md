# MediStand — Hardware Circuit Connections & Wiring Guide

This document provides the complete, step-by-step electrical circuit schematic, pin-to-pin wiring tables, color codes, and visual diagrams for assembling the **MediStand** IoT smart medicine bottle stand.

---

## 1. Components Checklist

| Component | Quantity | Purpose |
| :--- | :---: | :--- |
| **NodeMCU ESP8266** (ESP-12E) | 1 | Microcontroller with Wi-Fi |
| **HX711 Amplifier Module** | 1 | 24-bit Analog-to-Digital Converter for weight sensing |
| **Load Cell (1kg, 5kg, or 10kg)** | 1 | Strain gauge sensor to measure bottle weight |
| **Buzzer** (5V Active Buzzer) | 1 | Audible alert on medication time & bottle removal |
| **LED** (5mm Blue, Green, or Red) | 1 | Visual indicator for interaction state |
| **Resistor (220Ω or 330Ω)** | 1 | Current limiting resistor for LED |
| **Half or Full Breadboard** | 1 | Prototyping base for connections |
| **Jumper Wires (M-M / M-F)** | ~12 | Circuit interconnects |
| **Micro-USB Cable** | 1 | Power and programming from PC or 5V 1A adapter |

---

## 2. Master Pin Connection Table

### A. HX711 Amplifier to NodeMCU ESP8266

| HX711 Pin | NodeMCU Pin | NodeMCU GPIO | Wire Type / Description |
| :--- | :--- | :--- | :--- |
| **VCC** | **3V3** (or **VIN**)* | 3.3V or 5V | Power Supply (*Note below) |
| **GND** | **GND** | Ground | Common Ground |
| **DT** (Data) | **D6** | GPIO12 | Serial Data Output from HX711 |
| **SCK** (Clock) | **D5** | GPIO14 | Serial Clock Input to HX711 |

> [!TIP]
> **Powering HX711:** 
> - Most purple and green HX711 breakout boards work stably at **3.3V (`3V3` pin)** on the NodeMCU.
> - If your load cell readings are noisy or fluctuating, connect HX711 **VCC to `VIN` (5V from USB)** and connect **GND to `GND`**. The digital outputs (DT, SCK) remain 3.3V logic compatible.

---

### B. 4-Wire Load Cell to HX711 Amplifier

Standard 4-wire strain gauge load cells (Avia / SparkFun / Generic AliExpress) follow this color code:

| Load Cell Wire Color | HX711 Terminal | Function |
| :--- | :---: | :--- |
| **RED** | **E+** (Excitation +) | Power / Excitation Voltage (+5V / +3.3V) |
| **BLACK** | **E-** (Excitation -) | Ground / Excitation Ground |
| **WHITE** | **A-** (Signal -) | Negative Output Signal / Inverting Input |
| **GREEN** | **A+** (Signal +) | Positive Output Signal / Non-inverting Input |
| **YELLOW / BARE** *(if present)*| **GND / SHIELD** | Cable Shielding (leave floating if no shield pin) |

> [!NOTE]
> If your load cell output values decrease when pressing down on the stand instead of increasing, simply swap **WHITE (A-)** and **GREEN (A+)**.

---

### C. Visual LED Indicator to NodeMCU ESP8266

| LED Terminal | Connection | NodeMCU Pin | Description |
| :--- | :--- | :--- | :--- |
| **Long Leg (Anode, +)** | Connect via **220Ω / 330Ω Resistor** | **D2** (GPIO4) | Controlled Output Signal |
| **Short Leg (Cathode, -)** | Direct connection | **GND** | Ground Rail |

---

### D. Audio Buzzer to NodeMCU ESP8266

| Buzzer Terminal | NodeMCU Pin | Description |
| :--- | :--- | :--- |
| **Positive (+)** (longer leg or marked with `+`) | **D7** (GPIO13) | Output Signal for Beep Alarm |
| **Negative (-)** (shorter leg) | **GND** | Ground Rail |

---

## 3. Visual Circuit Schematic (ASCII Art)

```text
                               +-------------------+
                               |   LOAD CELL       |
                               | (Strain Gauge Bar)|
                               +---+---+---+---+---+
                                   |   |   |   |
                                 RED BLK WHT GRN
                                   |   |   |   |
                               +---+---+---+---+---+
                               | E+  E-  A-  A+    |
                               |                   |
                               |    HX711 MODULE   |
                               |                   |
                               | VCC  GND  DT  SCK |
                               +--+----+---+----+--+
                                  |    |   |    |
             +--------------------+    |   |    +---------------+
             |                         |   |                    |
             |       +-----------------+   +--------------+     |
             |       |                                    |     |
             |       |                                    |     |
             V       V                                    V     V
          +----+---+----+-------------------------------+----+----+--+
          | 3V3    GND                                  D6   D5   ...|
          |                                             (DT)(SCK)    |
          |                      NodeMCU                             |
          |                      ESP8266                             |
          |                                                          |
          | D2                                          D7           |
          +--+-------------------------------------------+-----------+
             |                                           |
             | + (Anode)                                 | + (Positive)
             |                                           |
           [ 220Ω Resistor ]                             |
             |                                           |
           (LED)                                     (BUZZER)
             | - (Cathode)                               | - (Negative)
             |                                           |
             +-----------------------+-------------------+
                                     |
                                     V
                                 NodeMCU GND
```

---

## 4. NodeMCU ESP8266 Pinout Mapping Reference

The NodeMCU board uses DX pin labels on the PCB silkscreen, which map to internal ESP8266 GPIO numbers in the firmware:

| Board Pin (Silkscreen) | ESP8266 GPIO Number | MediStand Assignment | Safe for Boot? |
| :---: | :---: | :--- | :---: |
| **D2** | **GPIO4** | **LED Indicator** | Yes (No boot restrictions) |
| **D5** | **GPIO14** | **HX711 SCK** (Clock) | Yes |
| **D6** | **GPIO12** | **HX711 DT** (Data) | Yes |
| **D7** | **GPIO13** | **Buzzer** | Yes |
| **3V3**| — | **HX711 VCC** | 3.3V Power Rail |
| **GND**| — | **Common Ground** | Ground |
| **VIN**| — | *(Optional 5V USB in)*| 5V Power Rail |

---

## 5. Load Cell Mechanical Mounting & Stand Construction

For accurate bottle weight detection:

1. **Orientation Arrow:** Most straight-bar load cells have an arrow sticker. Mount the load cell so the arrow points in the direction of gravity / the downward force.
2. **Fixed Side (Base):** Screw or fix one end of the load cell firmly to the stationary bottom plate or enclosure using spacers.
3. **Floating Side (Platform):** Screw the opposite end of the load cell to the top bottle-holding disc or coaster, also using spacers so the center bar can freely flex without rubbing against the surface.
4. **Wiring Clearance:** Ensure the 4 wires coming out of the load cell have enough slack and are not under mechanical tension when a bottle is placed or removed.

---

## 6. Step-by-Step Wiring Sequence

1. **Step 1: Wire the Load Cell to the HX711 Board**
   - Solder or screw:
     - Red wire ➔ `E+`
     - Black wire ➔ `E-`
     - White wire ➔ `A-`
     - Green wire ➔ `A+`

2. **Step 2: Connect the HX711 Board to the NodeMCU**
   - Connect HX711 `GND` ➔ NodeMCU `GND`
   - Connect HX711 `VCC` ➔ NodeMCU `3V3` (or `VIN`)
   - Connect HX711 `DT`  ➔ NodeMCU `D6`
   - Connect HX711 `SCK` ➔ NodeMCU `D5`

3. **Step 3: Connect the LED**
   - Insert a 220Ω resistor between NodeMCU `D2` and the breadboard rail.
   - Connect the longer leg (Anode +) of the LED to the resistor.
   - Connect the shorter leg (Cathode -) to the breadboard `GND` rail (which connects to NodeMCU `GND`).

4. **Step 4: Connect the Buzzer**
   - Connect the Buzzer `+` leg ➔ NodeMCU `D7`.
   - Connect the Buzzer `-` leg ➔ NodeMCU `GND`.

5. **Step 5: Power & Verification**
   - Plug the Micro-USB cable into the NodeMCU and your PC.
   - Open Arduino IDE Serial Monitor at **115200 baud**.
   - Verify output: `System Ready & Monitoring Active`.

---

## 7. Troubleshooting Hardware Connections

| Issue / Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| **`HX711 not ready` in Serial Monitor** | DT or SCK loose, or pins swapped | Swap wires between D5 and D6. Ensure VCC & GND are firm. |
| **Values decrease when bottle is placed** | Differential signal wires reversed | Swap **White (A-)** and **Green (A+)** on the HX711 board. |
| **Readings jump randomly by > 50,000 counts** | Floating ground or loose connection | Check that NodeMCU and HX711 share a solid ground. Use solid jumper wires. |
| **LED does not light up when bottle is lifted** | Reverse LED polarity or bad pin | Turn LED 180 degrees. Ensure longer leg leads through resistor to D2. |
| **Buzzer stays on continuously or is faint** | Incorrect pin or low power | Verify positive leg is on D7 and negative on GND. Check `threshold` value. |
| **Weight difference is less than threshold (12000)** | Light plastic bottle or small load cell | In the firmware or Web Dashboard (Bottle Monitoring tab), lower threshold from `12000` to `4000` or calibrate. |

---

## 8. Safety Precautions
- **Do not short 3V3 to GND** while powered.
- Always unplug the USB cable while making or altering breadboard connections.
- Ensure the HX711 pins do not touch conductive metal surfaces on the stand.

