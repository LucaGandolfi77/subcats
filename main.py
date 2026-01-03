from subcats import SubCats
import os

# Crea un file audio dummy se non ne hai uno (opzionale, solo per test se necessario)
# In un caso reale, useresti un file audio vero.
# Per questo esempio, assumiamo che l'utente debba fornire un path valido.

def main():
    # Inizializza la libreria
    # Usa 'base' o 'small' per velocità, 'large' per massima precisione
    app = SubCats(model_size="base")

    # Cerca un file audio supportato nella directory corrente
    audio_extensions = ['.mp3', '.wav', '.ogg', '.m4a', '.webm']
    audio_file = "sample_audio_01.mp3" # Default

    if not os.path.exists(audio_file):
        # Prova a trovare un altro file audio
        found = False
        for file in os.listdir("."):
            if any(file.lower().endswith(ext) for ext in audio_extensions):
                audio_file = file
                found = True
                break
        
        if not found:
            print(f"Nessun file audio trovato (cercati: {', '.join(audio_extensions)}).")
            print("Inserisci un file audio (es. 'audio.ogg') nella cartella e riprova.")
            return

    print(f"Elaborazione file: {audio_file}")

    # Genera sottotitoli in Italiano, Inglese e Spagnolo
    app.generate_subtitles(
        audio_path=audio_file,
        target_languages=["it", "en", "es"],
        output_dir="./sottotitoli_output"
    )

if __name__ == "__main__":
    main()
