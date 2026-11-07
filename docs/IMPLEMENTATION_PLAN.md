# Remaining implementation and validation plan

Follow dependencies in this order. Checkboxes are intentionally unchecked unless evidence exists. Do not mark a feature complete solely because its source file exists.

## 1. Stabilize the current source snapshot

- [ ] Read PROJECT_CONTEXT.md, linked docs, AGENTS.md and the changed source files.
- [ ] Preserve existing user edits and the old APK; no destructive reset/clean.
- [ ] Add ignore rules for firmware build outputs and private recordings.
- [ ] Add a lightweight test runner/script for pure core modules.
- [ ] Run app syntax/bundle checks to expose current integration errors.
- [ ] Inspect dependency audit findings; apply only understood compatible changes.

Acceptance: core tests run locally, app bundles, no undocumented destructive changes.

## 2. Finish hardware connection UX and lifecycle

- [ ] Replace hardcoded BLEScan devices with discovered IDs/names/sides/RSSI.
- [ ] Support connect/disconnect/retry for each foot, truthful pending/error state.
- [ ] Register BLEScan in a root stack reachable after onboarding.
- [ ] Make demo selection explicit and route mode changes through safe flush/reset logic.
- [ ] Show Bluetooth permission/off/unsupported-runtime errors with recovery instructions.
- [ ] Add telemetry freshness, packet-gap count and sensor/calibration status.
- [ ] Add acknowledged calibration with timeout; instruct the user to unload FSRs.
- [ ] Test connect cancellation, repeated taps, side replacement, mode switching and reconnect failures.
- [ ] Add a telemetry watchdog and bounded recovery strategy.

Acceptance: no fake IDs, no success before actual connection, no stale values presented as live; demo never silently replaces hardware.

## 3. Make data and persistence reliable

- [ ] Fix UserContext profile/settings persistence ordering.
- [ ] Make durable storage errors observable rather than quietly claiming success.
- [ ] Test midnight rollover, restart on a later day, device reboot and counter reset.
- [ ] Confirm periodic writes continue during 50 Hz streams; serialize snapshots safely.
- [ ] Validate imported/stored data shapes and handle corruption without crashing.
- [ ] Guard symmetry against missing sides and explicitly define metric units.
- [ ] Stop cross-mode session contamination and async hydration races.

Acceptance: real zeros remain zero, restart restores real summaries, device reset does not erase daily totals or add old counts, failed saves are visible.

## 4. Connect the UI to real data

- [ ] Remove sample dates, fake percentages, fake patient diagnoses and fallback sensor readings.
- [ ] Add unknown/unclassified/standing model states and canonical labels everywhere.
- [ ] Preserve useful existing visual components while making empty/disconnected states truthful.
- [ ] Make LiveView pause actually freeze displayed samples without stopping recording.
- [ ] Replace fixed cadence/contact-time/stance-ratio values with measured implementations or unavailable labels.
- [ ] Display pressure normalization and heatmap interpolation honestly.
- [ ] Read history from actual daily records and derive date ranges dynamically.
- [ ] Fix alert dismissal/filtering/counts and avoid clinical claims.
- [ ] Remove unsupported haptic/diagnostic functionality or label it as unavailable.

Acceptance: no hardware/model disconnected state looks like a healthy measured result; every displayed metric has a defined source.

## 5. Recording, model import and report export

- [ ] Add a recording/model screen and route.
- [ ] Enter participant pseudonym, controlled label, session metadata and sensor configuration version.
- [ ] Record complete timestamped samples and provenance; show duration/count/gaps.
- [ ] Save recordings durably during collection and recover after interruption.
- [ ] Export JSON for the trainer and optionally CSV for inspection using actual files/share sheet.
- [ ] Provide explicit discard; prevent accidental overwrite/mode switching before export.
- [ ] Import model JSON with file size limits, strict validation and a clear model/version status.
- [ ] Clear model/window state safely on removal or replacement.
- [ ] Build reports from actual range-selected data; escape user text in HTML.
- [ ] Report export errors honestly and distinguish PDF generated from share sheet opened.

Acceptance: exported session parses, contains both sides and correct units; unknown remains unknown without a model; reports contain no invented clinical facts.

## 6. Offline ML workflow

- [ ] Implement the workflow in ML_PLAN.md, including participant-grouped evaluation.
- [ ] Add feature/inference parity fixtures between Python and JavaScript.
- [ ] Reject demo/corrupt/unlabeled data for real training.
- [ ] Export compatible JSON and reproducible evaluation artifacts.
- [ ] Document what is and is not supported by the collected dataset.

Acceptance: reproducible training command, no train/test participant leakage, app reproduces reference model outputs. Actual accuracy requires real data.

## 7. Build and hardware validation

- [x] Compile firmware for both feet (2026-09-11).
- [ ] Verify actual board identity/flash/pin mapping before upload.
- [ ] Flash left/right firmware to the correctly identified boards.
- [ ] Check regulated supply with a meter, then test load transients and battery current.
- [ ] Verify I2C addresses, each FSR channel, motion axes, and calibration persistence.
- [ ] Measure actual sample rate and jitter; confirm two streams can run together.
- [ ] Measure packet loss and reconnect behavior while walking and at realistic distances.
- [ ] Validate contact thresholds and step counts against manual/video counts.
- [ ] Build current Android APK and test permission/connection/recording/export on a physical phone.
- [ ] Test restart, background/resume, power cycle, one-foot disconnect and low battery behavior.
- [ ] Measure runtime for the selected battery; do not reuse assumed runtime values.

Acceptance: record test setup/results, including failures and limits. Physical tests cannot be replaced by code inspection.

## 8. Final-year deliverables

- [ ] Setup README and exact wiring/assembly guide with photos of actual hardware.
- [ ] Firmware build/upload instructions, protocol reference and app installation guide.
- [ ] Architecture/data-flow diagrams and justified hardware decisions.
- [ ] Dataset collection protocol, consent/approval requirements where applicable, anonymized participant IDs.
- [ ] Model methodology, participant-separated evaluation, confusion matrix and failure analysis.
- [ ] Hardware validation, sample-rate/latency/loss/runtime measurements.
- [ ] Demo script and clear known-limitations section.
- [ ] Final report/presentation only once actual results exist; never invent outcomes.

## Useful commands

From app repository:

```powershell
npm install
npx expo start --web
npx expo run:android
```

Web can validate UI/demo behavior, not native BLE. An Android SDK/JDK/device and compatible generated native project are required for native builds; availability was not verified.

From firmware directory:

```powershell
python -m platformio run
python -m platformio device list
python -m platformio run -e left -t upload --upload-port <identified-port>
python -m platformio run -e right -t upload --upload-port <identified-port>
python -m platformio device monitor --port <identified-port> --baud 115200
```

Replace placeholder ports with actual identified devices. Disconnect external boost power when programming over USB unless power isolation has been verified.

## Minimum meaningful automated checks

- Codec round-trip fixtures generated independently from documented firmware byte layout.
- Invalid flags, side mismatch, missing/reordered fragments, duplicate sequence, sequence/uptime wrap and reboot.
- ADC conversion and signed IMU extremes.
- Constant and varying signals for exact feature extraction.
- Invalid/cyclic/deep model rejection and Python/JS prediction parity.
- Step-counter reset/reconnect/midnight logic and no-data behavior.
- Persistent save cadence while packets continuously arrive.
- Correct report date filtering and HTML escaping; failed export is not success.
- BLE lifecycle using mocked native calls plus physical tests for the actual transport.
