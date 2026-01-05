
# SubCats 🐱🎤

SubCats is a Python library for generating multilingual subtitles from audio files. It leverages state-of-the-art models for accurate transcription and translation.

## Features

- Automatic speech recognition (ASR) via OpenAI Whisper.
- Support for common audio formats (MP3, WAV, OGG, M4A) via ffmpeg.
- Translation using `deep-translator` (e.g. Google Translate, DeepL).
- Generates `.srt` subtitle files and a detailed translation log.

## Prerequisites

ffmpeg must be installed on the host system.

On Ubuntu/Debian:

```bash
sudo apt update && sudo apt install ffmpeg
```

## Installation

Install the project dependencies and the package itself:

```bash
pip install -r requirements.txt
pip install .
```

## Usage

Quick example:

```python
from subcats import SubCats

subcats = SubCats(model_size="base")
subcats.generate_subtitles(
    audio_path="your_audio.mp3",
    target_languages=["it", "en", "fr"],
    output_dir="./output"
)
```

## Build scripts (optional)

Two helper scripts are provided to automate creation of a Windows standalone executable using PyInstaller:

- `build_windows.ps1` — PowerShell script for Windows.
- `build_windows.sh` — Bash script for Unix/WSL environments.

Example (Bash/WSL):

```bash
./build_windows.sh
# output: dist/SubCatsCLI.exe
```

## Detailed build instructions (Linux / WSL)

These steps replicate the procedure used to build `dist/SubCatsCLI.exe` in a Linux/WSL environment.

1. Install system packages:

```bash
sudo apt update
sudo apt install -y python3-dev python3.12-venv build-essential pkg-config libssl-dev ffmpeg
```

2. Create and activate a virtual environment using the system Python (ensures a shared libpython is available):

```bash
/usr/bin/python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip setuptools wheel
```

3. To avoid bundling large CUDA artifacts (and reduce disk usage), install the CPU-only PyTorch wheel:

```bash
pip install --index-url https://download.pytorch.org/whl/cpu torch
```

4. Install project dependencies and the package itself:

```bash
pip install -r requirements.txt
pip install .
```

5. Clean previous build outputs to free space if needed:

```bash
rm -rf build dist
pip cache purge
```

6. Run the build script which generates the PyInstaller spec and runs PyInstaller:

```bash
./build_windows.sh
# result: dist/SubCatsCLI.exe
```

Notes:

- If PyInstaller reports "Python was built without a shared library", recreate the venv using `/usr/bin/python3` or install `python3-dev`, or rebuild Python with `--enable-shared`.
- If disk space is constrained, prefer the CPU-only `torch` wheel or remove CUDA packages before building.
- The produced executable can be large (hundreds of MB to several GB) depending on included dependencies.

## Output structure

The library will produce the following files in the output folder:

1. `filename.it.srt` — Italian subtitles
2. `filename.en.srt` — English subtitles
3. `filename.fr.srt` — French subtitles
4. `filename_translation_log.txt` — Detailed translation log with timestamps
# SubCats 🐱🎤

**SubCats** è una libreria Python per la generazione automatica di sottotitoli multilingua a partire da file audio. Utilizza tecnologie allo stato dell'arte (SOTA) per garantire alta precisione.

## Caratteristiche

- **Riconoscimento Vocale (ASR):** Utilizza [OpenAI Whisper](https://github.com/openai/whisper) per una trascrizione robusta e precisa.
- **Supporto Formati:** Compatibile con MP3, WAV, OGG, M4A e altri formati supportati da ffmpeg.
- **Traduzione:** Utilizza `deep-translator` (supporto per Google Translate, DeepL, ecc.) per generare sottotitoli in molteplici lingue.
- **Logging:** Genera un file di log dettagliato con timestamp e confronto tra testo originale e tradotto.
- **Output:** File standard `.srt` pronti per l'uso.

## Prerequisiti

È necessario avere `ffmpeg` installato sul sistema.

Su Ubuntu/Debian:
```bash
sudo apt update && sudo apt install ffmpeg
```

## Installazione

Puoi installare la libreria e le dipendenze eseguendo:

```bash
pip install -r requirements.txt
pip install .
```

## Utilizzo

Ecco un esempio di come utilizzare `SubCats` nel tuo codice:

```python
from subcats import SubCats

# Inizializza il modello (tiny, base, small, medium, large)
subcats = SubCats(model_size="base")

# Genera sottotitoli
subcats.generate_subtitles(
    audio_path="il_tuo_audio.mp3",
    target_languages=["it", "en", "fr"], # Codici lingua ISO
    output_dir="./output"
)
```

### CLI e Windows

Dopo l'installazione (`pip install .`) viene creato anche il comando `subcats` (console script).

Esempio su Windows usando il launcher `py.exe`:

```powershell
py -3 -m pip install -r requirements.txt
py -3 -m pip install .
subcats percorso\al\file.ogg -l it en es -o C:\output\sottotitoli
```

Per creare un eseguibile Windows standalone si può usare `PyInstaller` (attenzione: l'eseguibile sarà molto grande perché include dipendenze come `torch` e `openai-whisper`):

```powershell
py -3 -m pip install pyinstaller
pyinstaller --onefile --name SubCatsCLI subcats\cli.py
# il binario verrà creato in dist\SubCatsCLI.exe
```

Nota: Se non vuoi creare un exe, puoi sempre eseguire direttamente lo script con `py main.py` o `py -m subcats.cli`.

## Script di build (opzionale)

Sono forniti due script per automatizzare la creazione dell'eseguibile Windows con `PyInstaller`:

- `build_windows.ps1` — PowerShell per Windows: crea un virtualenv, installa le dipendenze e lancia `pyinstaller`.
- `build_windows.sh` — Bash per ambienti Unix/WSL: crea venv, installa dipendenze e lancia `pyinstaller`.

Esempio (PowerShell):

```powershell
.\build_windows.ps1
# output: dist\SubCatsCLI.exe
```

Esempio (Bash / WSL):

```bash
./build_windows.sh
# output: dist/SubCatsCLI.exe
```

Avvertenze e suggerimenti:

- L'eseguibile risultante sarà molto grande (inclusi `torch` e `openai-whisper`).
- Se vuoi ridurre le dimensioni o velocizzare la build, considera alternative come `faster-whisper` o l'uso di un servizio cloud per la trascrizione.
- Testa sempre l'eseguibile su una macchina Windows simile all'ambiente target.


## Struttura Output

La libreria genererà nella cartella di output:
1. `nomefile.it.srt` (Sottotitoli in Italiano)
2. `nomefile.en.srt` (Sottotitoli in Inglese)
3. `nomefile.fr.srt` (Sottotitoli in Francese)
4. `nomefile_translation_log.txt` (Log dettagliato con timestamp)
