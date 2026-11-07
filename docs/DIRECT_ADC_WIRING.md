# Direct-ADC wiring: no ADS1115

This is the current wiring for **one foot**. Build the same circuit a second time for the other foot, using a separate ESP32-C3, MPU6050 and four FSRs. The default PlatformIO `left` and `right` environments use this pin map. Check the **printed pin labels on your own ESP32-C3 SuperMini**; never use a pin's physical position from a different board photograph as the identifier.

## Start with USB power only

Leave the Li-Po battery and 5 V boost module disconnected for the first sensor test. Connect the ESP32-C3 to a computer by USB. Its 3V3 and GND pins supply the MPU6050 breakout and the FSR circuits. All GND connections must join together. Do not connect any GPIO or sensor to 5 V.

| ESP32-C3 SuperMini pin | Connect to |
|---|---|
| 3V3 | MPU6050 VCC; one **10 kΩ series resistor** for each of four FSRs |
| GND | MPU6050 GND; one **10 kΩ pull-down resistor** for each of four FSRs; MPU6050 AD0 |
| GPIO6 | MPU6050 SDA |
| GPIO5 | MPU6050 SCL |
| GPIO0 | Heel FSR measurement junction |
| GPIO1 | Midfoot/lateral arch FSR measurement junction |
| GPIO3 | Medial forefoot FSR measurement junction |
| GPIO4 | Lateral forefoot FSR measurement junction |

Leave MPU6050 XDA, XCL and INT unconnected. On the pictured GY-521 board the signal labels read VCC, GND, SCL, SDA, XDA, XCL, AD0, INT from top to bottom, but verify the silkscreen before wiring. AD0 to GND selects the default I2C address. GPIO2 is deliberately unused because it affects ESP32-C3 boot strapping.

Wire **each** of the four FSRs like this, changing only the GPIO number:

```text
ESP 3V3 ──[10 kΩ resistor]──[FSR]──●── ESP GPIO0 (heel example)
                                   │
                              [10 kΩ resistor]
                                   │
ESP GND ────────────────────────────┘
```

The FSR is a two-terminal variable resistor; it has no + or − orientation. The dot is the measurement junction. The series 10 kΩ resistor limits this junction to about 1.65 V, within the chosen ADC range. **Do not wire an FSR directly between 3V3 and a GPIO, and do not omit the resistor from junction to GND.** This design uses eight 10 kΩ resistors per foot, sixteen for two feet. The exact pressure response will need on-foot calibration.

## Battery and boost, only after USB testing

```text
Protected Li-Po + ── switch ── boost VIN
Protected Li-Po − ──────────── boost GND ── ESP GND
Boost regulated 5V output ───────────────── ESP 5V
```

The tiny boost board in the photo has VIN/GND/5V markings, but confirm each pad and measure its output with a multimeter before connecting the ESP. The boost is **not a charger**; charge the cell with a suitable separate charger. Never send 5 V to ESP 3V3, a GPIO, an FSR circuit, or MPU VCC in this wiring. Disconnect boost/battery power before using USB unless the exact SuperMini board's power-path isolation has been verified. Do not use an unprotected Li-Po or an uninsulated assembly in a shoe.

## First electrical check

1. With power off, inspect for shorts between 3V3 and GND and check all labels.
2. Power from USB. Measure 3V3 to GND (about 3.3 V), then each FSR junction to GND. The junction should remain between 0 and about 1.65 V while pressed.
3. Upload `left` firmware to the left board and `right` to the right board. The serial monitor prints FSR readings in millivolts. Press one FSR at a time and confirm only its expected channel increases.
4. Check that the MPU6050 is found and movement values change. Do not train or assess gait until the channel order and IMU orientation have been verified.

The direct ADC has less precision and potentially more noise than an ADS1115; it is enough to prototype and can be calibrated with real walking data. Firmware preserves the existing BLE packet format by converting direct ADC millivolts into ADS-equivalent counts. No sensor hardware or shoe assembly has been validated by the build test alone.
