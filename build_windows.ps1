<#
PowerShell script per creare un eseguibile Windows standalone di SubCats

Uso:
  Apri PowerShell come Administrator o utente normale, poi:
  .\build_windows.ps1

Questo script crea un virtualenv, installa dipendenze e lancia PyInstaller.
Nota: l'eseguibile sarà molto grande perché include `torch` e `openai-whisper`.
#>

param(
  [string]$PythonLauncher = "py -3",
  [string]$OutName = "SubCatsCLI",
  [string]$FfmpegPath = ""  # percorso a ffmpeg.exe, opzionale
)

Write-Host "Creazione virtualenv..."
& $PythonLauncher -m venv .venv
Write-Host "Attivazione virtualenv..."
.\.venv\Scripts\Activate.ps1

Write-Host "Aggiornamento pip e installazione dipendenze..."
pip install --upgrade pip
pip install -r requirements.txt
pip install .

# Genera automaticamente un file .spec che include ffmpeg (se fornito) e alcuni hiddenimports utili
$specPath = "SubCatsCLI.spec"
Write-Host "Generazione spec file: $specPath"

$hidden = @('whisper','tiktoken','numba','torch','deep_translator')

# Prepara entry per binaries
$binaries = @()
if ($FfmpegPath -ne "") {
  if (-Not (Test-Path $FfmpegPath)) {
    Write-Host "Attenzione: ffmpeg non trovato in $FfmpegPath" -ForegroundColor Yellow
  } else {
    $abs = (Resolve-Path $FfmpegPath).Path
    $binaries += "('$abs', '.')"
  }
}

# Scrive il contenuto dello spec
$hiddenimports_py = "[" + ($hidden | ForEach-Object { "'$_'" } ) -join ", " + "]"
$binaries_py = "[" + ($binaries -join ", ") + "]"

$spec = @"
# -*- mode: python ; coding: utf-8 -*-
import sys
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(['subcats\\cli.py'],
       pathex=['.'],
       binaries={binaries_py},
       datas=[],
       hiddenimports={hiddenimports_py},
       hookspath=[],
       runtime_hooks=[],
       excludes=[],
       cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
       cipher=block_cipher)
exe = EXE(pyz, a.scripts, [],
      exclude_binaries=True,
      name='{0}',
      debug=False,
      bootloader_ignore_signals=False,
      strip=False,
      upx=True,
      console=True )
coll = COLLECT(exe, a.binaries, a.zipfiles, a.datas, strip=False, upx=True, name='{0}')
"@ -f

$spec = $spec -f -f -f
$spec = $spec -replace "{binaries_py}", $binaries_py
$spec = $spec -replace "{hiddenimports_py}", $hiddenimports_py
$spec = $spec -replace "{0}", $OutName

Set-Content -Path $specPath -Value $spec -Encoding UTF8

Write-Host "Lancio PyInstaller con spec..."
pyinstaller --noconfirm $specPath

Write-Host "Build completata. Eseguibile disponibile in dist\$OutName.exe"
