<#
  Installs the heavy runtime the Amadeus companions need, into one shared folder
  (default W:\amadeus-runtime, or $env:AMADEUS_RUNTIME). The plugin itself carries only code.

    W:\amadeus-runtime\
      electron\electron.exe          standalone Electron for the companion window
      python\tts\                    Edge voices (edge-tts) + Silero (PyTorch CPU)
      python\kokoro\                 Kokoro-ru (onnxruntime, RUAccent, espeak)
      python\stt\                    local speech recognition (faster-whisper)
      models\silero\v5_6_ru.pt       Silero Russian voices
      models\speech\kokoro-ru\       Kokoro-ru model, voices, espeak data (models\speech\ruaccent fills itself)
      models\whisper\                faster-whisper "small" (downloaded on first use)

  Usage (PowerShell):
    .\install-runtime.ps1 -Check                 # only show what is there and what is missing
    .\install-runtime.ps1                        # install everything that is missing
    .\install-runtime.ps1 -Parts tts,kokoro      # only some parts
    .\install-runtime.ps1 -Runtime D:\amadeus    # another folder (then set AMADEUS_RUNTIME for DSH)

  Needs uv (https://docs.astral.sh/uv/): winget install astral-sh.uv
  Everything is skipped when already present, so it is safe to run again.
#>
param(
  [string]$Runtime = $(if ($env:AMADEUS_RUNTIME) { $env:AMADEUS_RUNTIME } else { 'W:\amadeus-runtime' }),
  [ValidateSet('electron', 'tts', 'kokoro', 'stt', 'models')]
  [string[]]$Parts = @('electron', 'tts', 'kokoro', 'stt', 'models'),
  [switch]$Check
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'                     # Invoke-WebRequest is very slow with the progress bar

$ElectronVersion = '44.7.0'
$PythonVersion = '3.12'
$SileroUrl = 'https://models.silero.ai/models/tts/ru/v5_6_ru.pt'
$SileroSize = 147664410
$KokoroRepo = 'zaakirio/kokoro-ru'
$KokoroRevision = 'd649c57b239b18c4c384378127cbf01dba039bc1'

$Envs = @{
  tts    = @{ Packages = @('edge-tts==7.3.1', 'numpy', 'omegaconf', 'silero==0.5.5'); Torch = 'torch==2.15.0'; Probe = 'import edge_tts, torch, omegaconf' }
  kokoro = @{ Packages = @('onnxruntime', 'numpy', 'ruaccent==1.5.8.3', 'misaki==0.9.4', 'phonemizer==3.4.0', 'espeakng-loader==0.2.4', 'transformers', 'huggingface_hub'); Probe = 'import onnxruntime, ruaccent, misaki, phonemizer, espeakng_loader' }
  stt    = @{ Packages = @('faster-whisper==1.2.1', 'numpy'); Probe = 'import faster_whisper' }
}

function Say($text, $color = 'Gray') { Write-Host $text -ForegroundColor $color }
function Ok($what) { Say "  [есть]  $what" 'Green' }
function Missing($what) { Say "  [нет]   $what" 'Yellow' }

function Test-Env($name) {
  $py = Join-Path $Runtime "python\$name\Scripts\python.exe"
  if (-not (Test-Path $py)) { return $false }
  # libraries print warnings on stderr; with ErrorActionPreference=Stop PowerShell 5.1 would treat them as errors
  $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & $py -c $Envs[$name].Probe 2>&1 | Out-Null; $ok = ($LASTEXITCODE -eq 0) } finally { $ErrorActionPreference = $old }
  return $ok
}

function Install-Electron {
  $exe = Join-Path $Runtime 'electron\electron.exe'
  if (Test-Path $exe) { Ok "Electron ($exe)"; return }
  Missing "Electron $ElectronVersion"
  if ($Check) { return }
  $zip = Join-Path $env:TEMP "electron-v$ElectronVersion-win32-x64.zip"
  Say "  скачиваю Electron $ElectronVersion (~110 МБ)…"
  Invoke-WebRequest "https://github.com/electron/electron/releases/download/v$ElectronVersion/electron-v$ElectronVersion-win32-x64.zip" -OutFile $zip -UseBasicParsing
  Expand-Archive $zip (Join-Path $Runtime 'electron') -Force
  Remove-Item $zip -Force
  Ok 'Electron установлен'
}

function Install-Env($name) {
  if (Test-Env $name) { Ok "Python-окружение $name"; return }
  Missing "Python-окружение $name"
  if ($Check) { return }
  if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { throw 'Нужен uv: winget install astral-sh.uv (https://docs.astral.sh/uv/)' }
  $dir = Join-Path $Runtime "python\$name"
  $py = Join-Path $dir 'Scripts\python.exe'
  $env:UV_CACHE_DIR = Join-Path $Runtime '.uv-cache'
  if (-not (Test-Path $py)) { & uv venv --python $PythonVersion $dir; if ($LASTEXITCODE) { throw "uv venv $name" } }
  $spec = $Envs[$name]
  if ($spec.Torch) {                                            # the CPU build of PyTorch (no CUDA, ~200 МБ instead of ~2.5 ГБ)
    & uv pip install --python $py $spec.Torch --index-url https://download.pytorch.org/whl/cpu
    if ($LASTEXITCODE) { throw "torch для $name" }
  }
  & uv pip install --python $py @($spec.Packages)
  if ($LASTEXITCODE) { throw "пакеты для $name" }
  if (Test-Env $name) { Ok "окружение $name готово" } else { throw "окружение $name не проходит проверку" }
}

function Install-Models {
  $silero = Join-Path $Runtime 'models\silero\v5_6_ru.pt'
  if ((Test-Path $silero) -and (Get-Item $silero).Length -eq $SileroSize) { Ok 'Silero v5_6_ru' }
  else {
    Missing 'Silero v5_6_ru (148 МБ)'
    if (-not $Check) {
      New-Item -ItemType Directory -Force (Split-Path $silero) | Out-Null
      Invoke-WebRequest $SileroUrl -OutFile "$silero.part" -UseBasicParsing
      if ((Get-Item "$silero.part").Length -ne $SileroSize) { throw 'Silero скачался не полностью' }
      Move-Item "$silero.part" $silero -Force
      Ok 'Silero скачан'
    }
  }
  $kokoro = Join-Path $Runtime 'models\speech\kokoro-ru'
  if ((Test-Path "$kokoro\config.json") -and (Test-Path "$kokoro\voices\sveta.bin") -and (Test-Path "$kokoro\espeak-data\ru_dict")) { Ok 'Kokoro-ru (модель, голоса, espeak)' }
  else {
    Missing 'Kokoro-ru (~0.8 ГБ)'
    if (-not $Check) {
      $py = Join-Path $Runtime 'python\kokoro\Scripts\python.exe'
      if (-not (Test-Path $py)) { throw 'Сначала окружение kokoro: -Parts kokoro' }
      $code = "from huggingface_hub import snapshot_download; snapshot_download('$KokoroRepo', revision='$KokoroRevision', local_dir=r'$kokoro', allow_patterns=['config.json','kokoro-config.json','onnx/model.onnx','onnx/model_quantized.onnx','onnx/model_dima_quantized.onnx','voices/*.bin','espeak-data/**'])"
      & $py -c $code
      if ($LASTEXITCODE) { throw 'Kokoro-ru не скачался' }
      Ok 'Kokoro-ru скачан'
    }
  }
  $whisper = Join-Path $Runtime 'models\whisper'
  if (Test-Path "$whisper\models--Systran--faster-whisper-small") { Ok 'Whisper small' }
  else { Say '  [позже] Whisper small (~470 МБ) скачается сам при первом локальном распознавании' 'Cyan' }
}

Say "Папка: $Runtime" 'White'
if (-not $Check) { New-Item -ItemType Directory -Force $Runtime | Out-Null }
foreach ($p in $Parts) {
  switch ($p) {
    'electron' { Install-Electron }
    'models' { Install-Models }
    default { Install-Env $p }
  }
}
if ($Runtime -ne 'W:\amadeus-runtime' -and -not $env:AMADEUS_RUNTIME) {
  Say "Папка не стандартная: задайте переменную окружения AMADEUS_RUNTIME=$Runtime и перезапустите DSH." 'Cyan'
}
