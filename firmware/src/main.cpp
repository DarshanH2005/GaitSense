#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include <NimBLEDevice.h>
#include <atomic>

// Default build: four FSR dividers on the C3 ADC, MPU6050 on 3.3 V I2C.
// Optional ads_* environments retain the original external ADS1115 route.
#ifndef FSR_DIRECT
#define FSR_DIRECT 0
#endif
#if FSR_DIRECT
constexpr uint8_t FSR_PINS[4] = {0, 1, 3, 4};
constexpr const char* BASELINE_KEY = "zero_adc";
#else
constexpr const char* BASELINE_KEY = "zero";
#endif
constexpr uint8_t ADS = 0x48, MPU = 0x68;
constexpr const char* SERVICE = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
constexpr const char* DATA = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
constexpr const char* COMMAND = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
Preferences prefs;
NimBLECharacteristic* telemetry;
std::atomic<bool> connected(false), tareRequested(false);
uint16_t baseline[4] = {}, adc[4] = {}, sequence = 0;
uint32_t tareSum[4] = {}, bootId, steps = 0, lastStep = 0;
bool calibrated = false, contact = false;
uint16_t tareRemaining = 0;

bool write8(uint8_t addr, uint8_t reg, uint8_t value) {
  Wire.beginTransmission(addr); Wire.write(reg); Wire.write(value); return Wire.endTransmission() == 0;
}
bool readBytes(uint8_t addr, uint8_t reg, uint8_t* out, uint8_t count) {
  Wire.beginTransmission(addr); Wire.write(reg);
  if (Wire.endTransmission(false) != 0 || Wire.requestFrom(addr, count) != count) return false;
  for (uint8_t i = 0; i < count; i++) out[i] = Wire.read();
  return true;
}
bool readADC(uint8_t channel, uint16_t& value) {
#if FSR_DIRECT
  // Two 10k resistors plus the FSR limit the junction to <=1.65 V.
  // Preserve protocol v1's ADS units (one count = 0.125 mV), so the phone
  // decoder and its pressure normalization do not need a format change.
  const uint32_t millivolts = analogReadMilliVolts(FSR_PINS[channel]);
  const uint32_t equivalentCounts = millivolts * 8U;
  value = static_cast<uint16_t>(equivalentCounts > 32767U ? 32767U : equivalentCounts);
  return true;
#else
  // Start single conversion: +/-4.096 V (125 uV/count), 860 SPS, comparator disabled.
  uint16_t config = 0x8000 | ((4 + channel) << 12) | 0x0200 | 0x0100 | 0x00e0 | 0x0003;
  Wire.beginTransmission(ADS); Wire.write(1); Wire.write(config >> 8); Wire.write(config & 255);
  if (Wire.endTransmission() != 0) return false;
  uint8_t b[2]; uint32_t start = millis();
  do {
    delay(1);
    if (!readBytes(ADS, 1, b, 2)) return false;
    if (b[0] & 0x80) {
      if (!readBytes(ADS, 0, b, 2)) return false;
      int16_t raw = int16_t((b[0] << 8) | b[1]); value = raw > 0 ? raw : 0; return true;
    }
  } while (millis() - start < 10);
  return false;
#endif
}
void put16(uint8_t* out, int offset, uint16_t value) { out[offset] = value & 255; out[offset + 1] = value >> 8; }
void put32(uint8_t* out, int offset, uint32_t value) { for (int i = 0; i < 4; i++) out[offset + i] = (value >> (8 * i)) & 255; }
int16_t sensor16(uint8_t* b, int i) { return int16_t((b[i] << 8) | b[i + 1]); }

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer*, NimBLEConnInfo&) override { connected = true; }
  void onDisconnect(NimBLEServer*, NimBLEConnInfo&, int) override { connected = false; NimBLEDevice::startAdvertising(); }
};
class CommandCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c, NimBLEConnInfo&) override {
    // Sampling/NVS writes happen on the main loop, never the BLE callback thread.
    if (c->getValue() == "tare") tareRequested = true;
  }
};

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN); Wire.setClock(400000); Wire.setTimeOut(20);
#if FSR_DIRECT
  analogReadResolution(12);
  for (uint8_t pin : FSR_PINS) analogSetPinAttenuation(pin, ADC_11db);
#endif
  bootId = esp_random();
  prefs.begin("gaitsense", false);
  calibrated = prefs.getBytesLength(BASELINE_KEY) == sizeof(baseline);
  if (calibrated) prefs.getBytes(BASELINE_KEY, baseline, sizeof(baseline));
  uint8_t who = 0;
  bool imuOK = readBytes(MPU, 0x75, &who, 1) && who == 0x68;
  imuOK = imuOK && write8(MPU, 0x6b, 0x01) && write8(MPU, 0x1a, 0x03) &&
    write8(MPU, 0x19, 19) && write8(MPU, 0x1b, 0x08) && write8(MPU, 0x1c, 0x10);
  uint16_t test;
  if (!imuOK || !readADC(0, test)) {
#if FSR_DIRECT
    while (true) { Serial.println("SENSOR ERROR: check MPU 3.3V, GND, GPIO6 SDA, GPIO5 SCL, AD0=GND (0x68). Reset after repair."); delay(2000); }
#else
    while (true) { Serial.println("SENSOR ERROR: check 3.3V, GND, GPIO4 SDA, GPIO5 SCL, ADS=0x48, MPU=0x68. Reset after repair."); delay(2000); }
#endif
  }
  NimBLEDevice::init(INSOLE_RIGHT ? "GaitInsole-R" : "GaitInsole-L");
  auto server = NimBLEDevice::createServer(); server->setCallbacks(new ServerCallbacks());
  auto service = server->createService(SERVICE);
  telemetry = service->createCharacteristic(DATA, NIMBLE_PROPERTY::NOTIFY);
  auto command = service->createCharacteristic(COMMAND, NIMBLE_PROPERTY::WRITE);
  command->setCallbacks(new CommandCallbacks()); service->start();
  auto advertising = NimBLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE); advertising->setName(INSOLE_RIGHT ? "GaitInsole-R" : "GaitInsole-L");
  advertising->enableScanResponse(true); advertising->start();
  Serial.println(FSR_DIRECT ? "Ready: direct ADC FSRs, 50 Hz target. Unload sensors and send tare." : "Ready: ADS1115 FSRs, 50 Hz target. Unload sensors and send tare.");
}

void loop() {
  static uint32_t next = 0, lastError = 0;
  if (int32_t(millis() - next) < 0) { delay(1); return; }
  const uint32_t sampleTime = millis(); next = sampleTime + 20;
  sequence++;
  if (tareRequested.exchange(false)) { tareRemaining = 100; calibrated = false; memset(tareSum, 0, sizeof(tareSum)); }
  bool ok = true;
  for (int i = 0; i < 4; i++) if (!readADC(i, adc[i])) ok = false;
  uint8_t imu[14]; if (!readBytes(MPU, 0x3b, imu, 14)) ok = false;
  if (!ok) {
    if (millis() - lastError > 1000) { Serial.println("Sensor read failed; dropping frame"); lastError = millis(); }
    return;
  }
  if (tareRemaining) {
    for (int i = 0; i < 4; i++) tareSum[i] += adc[i];
    if (--tareRemaining == 0) {
      for (int i = 0; i < 4; i++) baseline[i] = tareSum[i] / 100;
      prefs.putBytes(BASELINE_KEY, baseline, sizeof(baseline)); calibrated = true; contact = false;
      Serial.println("Tare complete");
    }
  }
  uint8_t payload[32] = {}; put32(payload, 0, sampleTime);
  uint32_t load = 0;
  for (int i = 0; i < 4; i++) {
    uint16_t corrected = adc[i] > baseline[i] ? adc[i] - baseline[i] : 0;
    put16(payload, 4 + i * 2, corrected); load += corrected;
  }
#if FSR_DIRECT
  static uint32_t lastPrint = 0;
  if (sampleTime - lastPrint >= 1000) {
    Serial.printf("FSR mV heel=%u mid=%u medial=%u lateral=%u, tare=%s\n",
      adc[0] / 8, adc[1] / 8, adc[2] / 8, adc[3] / 8,
      calibrated ? "complete" : "needed");
    lastPrint = sampleTime;
  }
#endif
  // Starting contact thresholds, to be validated/tuned on the assembled insole.
  if (calibrated && !contact && load > 5280 && sampleTime - lastStep >= 250) { contact = true; steps++; lastStep = sampleTime; }
  if (load < 2640) contact = false;
  for (int i = 0; i < 3; i++) {
    put16(payload, 12 + i * 2, int16_t(lround(sensor16(imu, i * 2) * 1000.0f / 4096)));
    put16(payload, 18 + i * 2, int16_t(lround(sensor16(imu, 8 + i * 2) * 10.0f / 65.5f)));
  }
  put32(payload, 24, steps); put32(payload, 28, bootId);
  if (connected) {
    for (int part = 0; part < 2; part++) {
      uint8_t frame[20]; frame[0] = 0xa1; frame[1] = part | (INSOLE_RIGHT ? 2 : 0) | (calibrated ? 4 : 0);
      put16(frame, 2, sequence); memcpy(frame + 4, payload + 16 * part, 16);
      telemetry->setValue(frame, sizeof(frame)); telemetry->notify();
    }
  }
}
