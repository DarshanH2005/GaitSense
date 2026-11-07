# Current implementation status

Snapshot: 2026-09-11. Status labels:

- **Existing**: present before this build session, not necessarily functional.
- **Written**: newly added/replaced; no app tests/build run yet.
- **Compiled**: firmware compilation passed only.
- **TODO**: not implemented or not integrated.

## Inventory

| Area | State | Evidence / limitation |
|---|---|---|
| App providers, navigation, visual components | Existing | Main tab screens, foot diagrams, charts, profile and onboarding exist. |
| Real BLE service | Written | `src/services/BLEService.js` replaced; native discovery, permissions, monitoring and retry logic. Needs race/lifecycle testing. |
| BLE React context | Written | `src/context/BLEContext.js` replaced; real mode defaults off-demo, explicit demo generator, packet listeners. |
| Packet codec and timestamp alignment | Written | `src/core/protocol.js`; two fragments, base64, sequence gaps, boot/clock handling. |
| Metrics helpers | Written | `src/core/metrics.js`; daily defaults, step deltas, class distribution, count symmetry. |
| Feature extraction/model validation/inference | Written | `src/core/model.js`; 40 features and JSON decision-tree evaluator. No model trained. |
| Gait state/data handling | Written | `src/context/GaitContext.js` replaced; throttled UI, model predictions, recording state, periodic snapshots, demo separation. |
| Left/right firmware | Compiled | `firmware/platformio.ini`, `firmware/src/main.cpp`; both environments succeeded. |
| File picker/filesystem packages | Installed | Added to package.json/lockfile; UI/services using them are TODO. |
| Device connection screen | Existing, incompatible | Still displays/selects hardcoded devices and uses local connection booleans. |
| History and report screens | Existing, incomplete | Hardcoded dates and sample metrics remain. |
| Recording and model management screen | TODO | Context methods exist, no route/UI/export integration. |
| Offline ML trainer | TODO | No `ml/` training code, dataset, evaluation, or exported model. |
| Current APK | TODO | Existing `GaitSense-v1.0.0.apk` is old, not rebuilt. |
| Automated tests | TODO | No test script added yet. |

## Files changed during the implementation session

Created:

- `src/core/protocol.js`
- `src/core/model.js`
- `src/core/metrics.js`
- `firmware/platformio.ini`
- `firmware/src/main.cpp`

Replaced:

- `src/services/BLEService.js`
- `src/context/BLEContext.js`
- `src/context/GaitContext.js`

Dependency changes:

- Installed `expo-file-system` and `expo-document-picker` using `npx expo install`.

No other app screens were changed before the user interrupted the build for this handoff.

## Immediate integration blockers

1. **BLEScanScreen still fabricates device selections.** It passes IDs such as `GAIT-L-4A2F` instead of the discovered platform device ID, marks connection locally before success, and changes demo mode on Continue. Rewrite around actual context discovery/status/error state.
2. **BLEScan route is unavailable after onboarding.** `AppNavigator` renders MainTabNavigator directly after onboarding; the BLEScan route only exists in OnboardingNavigator. Add a root stack that can open pairing from any main screen.
3. **Model/recording methods have no UI.** Add participant ID/label entry, start/stop, packet count/status, file export, explicit discard, model import/status/remove. Prevent loss of an unexported recording.
4. **Fake fallbacks remain across screens.** Dashboard uses `|| 2847`, `|| 94`, fixed confidence/cadence/session duration; LiveView has fixed FSR fallbacks/contact time/stance ratio. Real zero is not missing data. Render unavailable values as unavailable.
5. **Unknown classification is visually mislabeled.** Core now uses canonical lowercase labels and `unknown`; GAIT_CLASSES lacks unknown/standing entries and StatusBanner defaults unrecognized values to normal. Correct this before interpreting any dashboard result.
6. **History ignores real historyData.** Replace fixed August dates/MOCK_DAYS with actual records and empty states.
7. **Reports fabricate results and mask errors.** ReportScreen passes `{}` instead of an array as historyData, uses fixed date ranges and preview metrics, and claims success in catch. ReportService includes invented demographic/diagnosis/physician/metric defaults. Rebuild from actual selected-range records; report failure honestly.
8. **Profile callbacks are incompatible with new semantics.** It sends duplicate calibration commands, assumes completion, directly toggles BLE demo mode instead of GaitContext.changeMode, and only shows a CSV success message without sharing a file.

## Code concerns to inspect and test

These are static-review observations, not reproduced runtime failures:

- StorageService catches persistence errors and falls back to memory, hiding failures from the new context's error state. Decide explicit durable-write behavior.
- UserContext assigns a variable inside a React state updater then immediately saves it. The updater is not guaranteed to run synchronously. Fix profile/settings writes using a reliable current-state reference or serialized update flow.
- New context only records raw sessions in memory. App termination loses them; backgrounding stops recording but does not durably save the completed recording. Implement recovery/checkpoints or an appendable file.
- `changeMode` flushes before switching, but callers can bypass it through BLEContext.setDemoMode. Route all UI changes through the safe method; test async hydration/listener timing.
- BLE connection attempts are async. Mode changes, two taps on Connect, disconnect during connect/discovery, and replacing a side need cancellation/token tests.
- BLEService currently resets retry attempts after any good packet. A repeatedly flapping connection may retry indefinitely overall; define intended policy.
- Monitor errors can leave status `error` without actively reconnecting unless a disconnect callback follows. Add a no-telemetry watchdog and a clear retry action.
- Connected GATT state does not prove fresh telemetry. Surface freshness and successful calibration separately.
- Calibration write completion is not calibration completion. Firmware flag goes false while taring and true after 100 samples. Add an explicit acknowledgement/request identity or reliably observe the transition with timeout; do not show immediate success.
- Timestamp alignment uses minimum observed arrival delay, not synchronized clocks. New minimum offsets can move estimated sample timestamps backwards. Window code clears on non-increasing timestamps; test this and consider device-time-based feature windows.
- Step counters are cumulative per boot. Current delta logic treats first/new-boot sample as a baseline, preserving previous daily totals but not recovering steps while the phone was absent. Explain this scope.
- Symmetry is currently based only on observed step counts. It is not a validated biomechanical symmetry index. A missing foot must not look like measured asymmetry.
- Lowercase class names in core differ from some legacy components/services. Normalize all consumers, including alert filtering and toe-walking names.
- No native notification scheduling is present in the new GaitContext, although App.js still configures a handler. Implement notifications only with permissions/settings/cooldown and no diagnostic claims.
- Settings such as haptics/dark mode/sensitivity are mostly legacy placeholders. There is no haptic actuator in the selected hardware; hide or implement accurately.
- Firmware is built with a generic C3 DevKitM-1 target plus USB flags. Actual SuperMini flash size, boot/upload behavior, RF quality and pin mapping require board verification.
- Firmware I2C errors drop samples; no application-level error status message is emitted. Add diagnostics so missing sensors are explainable.
- Firmware stores only unloaded FSR baselines. This is not force calibration; ADC saturation and mechanical response need testing.
- Firmware notifies two fragments back-to-back; BLE queue capacity/rate must be measured with both feet. Sequence gaps expose dropped samples but do not recover them.
- Add `firmware/.pio/` and local datasets/build outputs to appropriate ignore rules. `.pio` artifacts currently exist and should not be treated as source.

## Build evidence

Command executed from firmware directory:

```powershell
python -m platformio run
```

Result: left SUCCESS (about 2m24s including setup), right SUCCESS (about 19s). Build process completed, exit code 0. No active firmware build remains from this session.

Artifacts exist under `.pio/build/left/` and `.pio/build/right/`. Use PlatformIO upload with the correct environment and detected serial port; do not flash an arbitrary connected device without identifying it.

No app tests, Android build, physical upload, or BLE tests were performed during implementation.
