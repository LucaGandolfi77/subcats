# -*- mode: python ; coding: utf-8 -*-
import sys
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(['subcats/cli.py'],
             pathex=['.'],
             binaries=[],
             datas=[],
             hiddenimports=['whisper','tiktoken','numba','torch','deep_translator'],
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
