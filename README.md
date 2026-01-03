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
