# Hardware and assembly plan

> **Current build (without ADS1115):** Use [DIRECT_ADC_WIRING.md](DIRECT_ADC_WIRING.md) for the wiring and the default `left`/`right` firmware environments. The ADS1115 bill of materials and GPIO4/GPIO5 I2C wiring below document the older, optional `ads_left`/`ads_right` design only; do not mix the two pin maps.

## Current intended bill of materials

| Item | Total for both feet | Notes |
|---|---:|---|
| Generic ESP32-C3 SuperMini | 2 | User's pictured board, not XIAO. Exact seller schematic not supplied. |
| ADS1115 breakout | 2 | Four single-ended channels per foot. Verify actual chip/board. |
| FSR | 8 | Assumes user already owns four and buys four additional; exact model/range unknown. |
| MPU6050 / GY-521 | 2 | Assumes one existing plus one additional. |
| Protected 3.7 V Li-Po | 2 | Original capacity 500–600 mAh; reduced capacity discussed but not finalized. |
| 7Semi TPS61023 fixed 5 V boost | 2 | One per foot; not a charger. |
| SPST switch | 2 | Disconnect boost input from battery positive. |
| JST-PH 2.0 battery connector/pigtail | 2 sets | Check actual battery polarity and mating parts. |
| 10 kOhm resistors | At least 8 | One divider per FSR; 10–20 originally proposed for spares. |
| 100 nF ceramic capacitors | Originally 10 | Placement/need depends on breakouts and filtering. |
| 10 uF ceramic capacitors | Originally 5–10 | Supply decoupling; verify converter recommendations. |
| 4.7 kOhm resistors | Optional | Do not blindly parallel with existing I2C pull-ups. |
| Flexible wire, insulation, strain relief | As needed | Important for repeated flexing. |
| Perfboard, enclosures, shoe mounts | 2 assemblies | No custom PCB is planned. |
| Six-pin inline prewired connector pairs | Optional 2 | Bare JST-SH PCB sockets are not needed for this assembly. |

Purchase/ownership has not been confirmed; the table is the working design, not an inventory of tested parts.

## Physical arrangement

Each insole contains four FSRs and flexible wiring. Each shoe has a firmly attached enclosure containing the MCU, ADC, IMU, battery, boost module and divider resistors. Attach the IMU enclosure to the shoe, not a loose ankle pouch, for consistent foot-motion measurements.

Keep rigid boards and the Li-Po away from weight-bearing sole areas and flex points. Insulate the battery from solder joints, secure connectors, and provide cable strain relief. Fix the IMU orientation and document it for all participants/sessions.

Current software/firmware channel order:

0. Heel
1. Midfoot/lateral arch
2. Medial forefoot
3. Lateral forefoot

Earlier conversation mentioned a toe/hallux fourth sensor, but the existing diagram/constants and current implementation use lateral forefoot. Resolve any physical placement change before collecting training data; update diagrams, schema, and model feature assumptions together.

## Per-foot power

```text
Protected Li-Po positive -> SPST switch -> TPS61023 VIN
Protected Li-Po negative --------------> TPS61023 GND
TPS61023 regulated 5V output ----------> SuperMini 5V
TPS61023 GND -------------------------> SuperMini GND
SuperMini regulated 3V3 --------------> compatible sensor power/dividers
Common GND ---------------------------> sensor GND/divider resistors
```

- Never put the boost's 5 V output on 3V3.
- Never connect raw Li-Po directly to 3V3 (full charge is about 4.2 V).
- User manages charging externally. Remove/disconnect the cell from the project as appropriate for the external charger and use a cell-compatible charge current.
- Disconnect boost power before attaching USB unless the actual board's power isolation is verified.
- Verify the actual SuperMini 5V input/regulator and sensor power circuits. Generic board variants differ.
- TPS61023 “3.7 A” is its typical switch-current limit, not a guaranteed continuous 5 V output rating.
- Measure battery current and supply dips during BLE activity. Earlier runtime numbers were arithmetic examples at an assumed 100 mA, not measured predictions.
- No battery-voltage measurement hardware is implemented. Do not display invented percentages; report unavailable until a suitable sensing circuit is added.

## Per-foot sensor wiring

Current firmware uses **GPIO4 SDA, GPIO5 SCL**, not XIAO-specific pin aliases. ADS1115 and MPU6050 share these lines.

| Signal | Destination |
|---|---|
| GPIO4 | ADS SDA and MPU SDA |
| GPIO5 | ADS SCL and MPU SCL |
| GND | Both board grounds, FSR divider returns |
| 3.3 V compatible supply | ADS supply, appropriate MPU breakout supply, FSR excitation |
| ADS ADDR | GND, expected address 0x48 |
| MPU AD0 | GND, expected address 0x68 |
| ADS A0–A3 | FSR divider junctions in the channel order above |

Inspect GY-521 regulator/pull-up wiring to choose a valid supply connection and ensure SDA/SCL are pulled to 3.3 V. Verify I2C addresses with a scan before gait trials. Local I2C wires should be short.

Each FSR divider:

```text
3.3 V -> FSR -> junction -> ADS input
                  |
                10 kOhm
                  |
                 GND
```

For an optional six-wire insole cable: pin 1 common 3.3 V excitation; pins 2–5 four FSR returns; pin 6 spare/disconnected. This is our custom assignment, not a connector industry standard. IMU wiring stays within the enclosure.

10 kOhm is a starting divider value, not a verified optimum for the unknown FSR. Test unloaded/loaded voltage, saturation, hysteresis and repeatability under the actual mounting. Tare removes an unloaded offset; force in newtons or pressure in kPa requires further calibration.

## Firmware behavior and first bench test

- Build environments `left` and `right` identify the foot in name and packets.
- Target sampling is 50 complete frames/second/foot; actual timing not measured.
- ADS1115 uses single-shot conversions, +/-4.096 V gain, 860 conversions/second setting. Four channels are multiplexed, not simultaneous.
- MPU6050 configured for +/-8 g, +/-500 degrees/s, 50 Hz register sample rate and DLPF setting 3.
- Unload all FSRs and send `tare`; firmware averages 100 samples and saves baselines in Preferences/NVS.
- Firmware stops at setup with serial diagnostics if the expected sensors are unavailable. Runtime I2C failures drop frames.
- Step detection is a provisional load-threshold/hysteresis method; compare it with counted steps before reporting accuracy.

## Reference sources checked during the discussion

- [ESP32-C3 datasheet](https://documentation.espressif.com/esp32-c3_datasheet_en.html)
- [7Semi TPS61023 board](https://7semi.com/tps61023-3-7a-5v-out-mini-boost-converter-breakout/)
- [TI TPS61023](https://www.ti.com/product/TPS61023)
- [TI ADS1115 datasheet](https://www.ti.com/lit/ds/symlink/ads1115.pdf)
- [MPU6050 specification](https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Datasheet.pdf)
- [FSR integration guides](https://www.interlinkelectronics.com/integration-guides)

The exact seller link for the SuperMini and FSR model is still unavailable. Component-level feasibility is not verification of a specific clone board or assembled circuit.
