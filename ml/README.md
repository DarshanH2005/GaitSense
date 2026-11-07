# GaitSense offline model training

Export labelled sessions from **Data & model** in the app and place the JSON files in a directory outside version control. Demo sessions are rejected deliberately.

```powershell
py -m pip install -r ml/requirements.txt
py ml/train.py --input recordings --output model.json --report evaluation.json
```

The trainer uses two-second, one-second-hop, per-foot windows and the same 40 features and validity rules as `src/core/model.js`. Participants—not individual windows—are separated between training and testing. Read `evaluation.json`; do not claim its measurements as clinical accuracy. Import `model.json` through the app only after reviewing the held-out participant results.

Minimum responsible dataset: real calibrated sessions from at least two participants and at least two classes. A larger, balanced dataset with several sessions/conditions per participant is required for meaningful results.

## Optional public research baseline

The included `download_public_baseline.ps1` downloads the 1.7 GB CC-BY Insole-GAITRite archive from Zenodo DOI 10.5281/zenodo.19662017. It is optional and is not version-controlled.

```powershell
./ml/download_public_baseline.ps1
py ml/public_baseline.py --input public-data --output public-baseline.json --report public-baseline-report.json
```

It creates an explicitly named IMU-only `standing` versus `normal` walking bootstrap. It intentionally zeros pressure features because the public 32-sensor geometry cannot be truthfully converted to our four FSR positions. Do not claim its output is clinically valid, a personal model, or a classifier for shuffle/limp/unsteady gait. Replace it after collecting and training on the user's real sessions.
