param([string]$Destination = "public-data")
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$Url = 'https://zenodo.org/api/records/19662017/files/insole-gaitrite-dataset.zip/content'
$Out = Join-Path $Destination 'insole-gaitrite-dataset.zip'
Write-Host "Downloading the 1.7 GB CC-BY dataset to $Out"
Invoke-WebRequest -Uri $Url -OutFile $Out
Write-Host 'Download complete. Do not extract the entire archive: selectively extract only L.csv/R.csv files for STAND, SP, NP, and FP before training.'
