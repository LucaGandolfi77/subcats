#!/usr/bin/env bash
# Script per preparare virtualenv e creare un exe Windows con PyInstaller
# (eseguirlo su una macchina Windows con WSL o su Linux per generare un exe compatibile)

set -euo pipefail

PY=python3
if command -v py >/dev/null 2>&1; then
  PY="py -3"
fi

FFMPEG_PATH=${FFMPEG_PATH:-""}

echo "Creazione virtualenv..."
$PY -m venv .venv
source .venv/bin/activate

echo "Aggiornamento pip e installazione dipendenze..."
pip install --upgrade pip
pip install -r requirements.txt
pip install .

SPEC_FILE=SubCatsCLI.spec
echo "Generazione spec file: $SPEC_FILE"

HIDDEN_IMPORTS=(whisper tiktoken numba torch deep_translator)

BINARY_ENTRIES=()
if [ -n "$FFMPEG_PATH" ]; then
  if [ ! -f "$FFMPEG_PATH" ]; then
    echo "Attenzione: ffmpeg non trovato in $FFMPEG_PATH"
  else
    ABS_FFMPEG=$(readlink -f "$FFMPEG_PATH")
    BINARY_ENTRIES+=("('$ABS_FFMPEG', '.')")
  fi
fi

hidden_py="["
for i in "${HIDDEN_IMPORTS[@]}"; do
  hidden_py+="'${i}',"
done
hidden_py=${hidden_py%,}
hidden_py+="]"

binaries_py="["
for b in "${BINARY_ENTRIES[@]}"; do
  binaries_py+="$b,"
done
binaries_py=${binaries_py%,}
binaries_py+="]"

cat > $SPEC_FILE <<EOF
# -*- mode: python ; coding: utf-8 -*-
import sys
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(['subcats/cli.py'],
             pathex=['.'],
             binaries=$binaries_py,
             datas=[],
             hiddenimports=$hidden_py,
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz, a.scripts, [],
          exclude_binaries=True,
          name='SubCatsCLI',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          console=True )
coll = COLLECT(exe, a.binaries, a.zipfiles, a.datas, strip=False, upx=True, name='SubCatsCLI')
EOF

echo "Lancio PyInstaller con spec..."
pyinstaller --noconfirm $SPEC_FILE

echo "Build completata. Eseguibile: dist/SubCatsCLI.exe"
