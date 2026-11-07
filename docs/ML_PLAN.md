# ML and dataset plan

## Current reality

No training dataset, trainer, fitted model, evaluation report or measured classification accuracy exists in this repository. `src/core/model.js` provides only feature extraction, structural validation and inference for a future exported decision tree. The firmware transmits sensors; it does not classify gait.

Do not train on the current synthetic demo and present that as real gait accuracy. Do not treat manually mimicked patterns as a clinical disease dataset.

## First model scope

Start with standing versus normal walking to validate collection, labeling, feature parity and deployment. Add further classes only with adequate, consistently labeled data.

Canonical supported labels in code:

```text
standing
normal
shuffle
limp
unsteady
toe_walk
```

`unknown` is an output state for missing/insufficient/low-confidence inference, not a training label in the current schema.

Current implementation is a per-foot classifier. If both sides share the same session label, describe that as a session-level label applied to each foot, not independently verified unilateral ground truth. Bilateral models require time alignment, joint features, and a revised schema/runtime.

## Collection protocol to implement

1. Freeze FSR placement/channel order, IMU orientation, voltage scaling and firmware version.
2. Verify unloaded/loaded channel response and no saturation; perform unloaded tare.
3. Enter an anonymized participant ID, activity label and unique session ID.
4. Record both feet with timestamps, boot IDs, sequence numbers, calibration and demo provenance.
5. Keep transitions and ambiguous behavior out of labeled windows or mark them explicitly.
6. Collect multiple sessions/speeds from multiple participants where feasible; document shoes and conditions.
7. Avoid intentionally unsafe movements. Any patient/clinical collection must follow applicable institutional approval and consent requirements.
8. Export and inspect recordings before collecting a large dataset.

Do not promise a fixed participant count or accuracy before defining the scope and obtaining actual data. Repeated samples from one person are not equivalent to independent participants.

## Features already implemented

Two-second per-foot windows, inference every one second. Current quality gate requires:

- At least 80 samples.
- At least 1800 ms between first and last sample.
- All samples calibrated.
- Same boot, strictly increasing timestamps.
- No adjacent gap greater than 100 ms.

Review whether these provisional thresholds are adequate after measuring the real stream. No imputation is currently implemented.

Channel order:

```text
p0, p1, p2, p3, ax, ay, az, gx, gy, gz
```

For each channel, concatenate:

```text
mean, population standard deviation, minimum, maximum
```

This gives **40 features**. Pressure is divided by 4095; acceleration remains g; angular velocity remains degrees/s. The mean/std/min/max calculation must match JavaScript exactly, including population variance (`ddof=0`). There is currently no learned standardization stage.

Use the exported `FEATURE_NAMES` from `src/core/model.js` as the authoritative ordering. Prefer a shared JS feature extraction CLI invoked during Python preparation, or prove independent Python extraction matches test fixtures.

## Training pipeline to write

Proposed files (not present yet):

```text
ml/README.md
ml/requirements.txt
ml/prepare_features.cjs
ml/train.py
ml/evaluate.py
ml/tests/
```

Pipeline:

1. Read exported sessions, validate schema and reject `demo: true` for actual training.
2. Split by participant, keeping every session/foot/window from that participant in one partition.
3. Construct windows without crossing session/boot/label boundaries.
4. Apply the same validity gate/features used on the phone.
5. Train a small decision-tree baseline with depth/leaf-size regularization.
6. Select hyperparameters only on training/validation participants.
7. Evaluate once on held-out participants, or use participant-grouped cross-validation when justified by dataset size.
8. Export node splits/leaves and ordered classes in the schema from ARCHITECTURE.md.
9. Export predictions/fixtures and verify JS inference parity.
10. Import the model on the phone, then compare live/offline outputs on the same recording.

Never randomly split overlapping windows from the same recording across train and test. Grouped evaluation prevents learning participant-specific characteristics from inflating the apparent performance on new people.

## Required evaluation outputs

- Number of participants, sessions and windows per class and partition.
- Excluded windows and reasons (gaps, calibration, corrupted packets, transitions).
- Confusion matrix, per-class precision/recall/F1, macro-F1 and class support.
- Clear distinction between participant-generalization and within-person testing.
- Inference latency and memory observations on the actual phone.
- Model version, feature version, seed, dependencies and training command.
- Limitations: mounting, shoes, session labels, simulated behavior, population, imbalance.

The current runtime rejects predictions below leaf probability 0.7. This is an initial heuristic, not a validated confidence calibration. Choose the threshold on validation data, report coverage/unknown rate, and keep final test participants untouched during selection.

## Research and product boundaries

Four FSRs sample four locations. A colored foot diagram interpolates between those locations and is not a dense calibrated pressure mat. A gait label is not a disease diagnosis. Report disease/fall-risk claims only if supported by a properly designed, relevant clinical validation study; no such study exists here.

## References

- [Scikit-learn grouped cross-validation guidance](https://scikit-learn.org/stable/modules/cross_validation.html)
- [Espressif ESP-DL model deployment/quantization](https://docs.espressif.com/projects/esp-dl/en/latest/tutorials/how_to_quantize_model.html) — optional future embedded neural inference, not the current phone-tree implementation.
