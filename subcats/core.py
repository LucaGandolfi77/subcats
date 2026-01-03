import os
import whisper
from deep_translator import GoogleTranslator
from .utils import write_srt, format_timestamp
import logging

class SubCats:
    def __init__(self, model_size="base", device="cpu"):
        """
        Inizializza la libreria SubCats caricando il modello Whisper.
        
        Args:
            model_size (str): Dimensione del modello Whisper ('tiny', 'base', 'small', 'medium', 'large').
            device (str): Dispositivo su cui eseguire il modello ('cpu' o 'cuda').
        """
        print(f"Caricamento modello Whisper '{model_size}' su {device}...")
        self.model = whisper.load_model(model_size, device=device)
        print("Modello caricato.")

    def generate_subtitles(self, audio_path, target_languages=['en'], output_dir="output"):
        """
        Genera sottotitoli e log delle traduzioni per un file audio.

        Args:
            audio_path (str): Percorso del file audio.
            target_languages (list): Lista dei codici lingua (es. ['it', 'en', 'es', 'fr']).
            output_dir (str): Cartella dove salvare i risultati.
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        log_file_path = os.path.join(output_dir, f"{base_name}_translation_log.txt")

        print(f"Inizio trascrizione di: {audio_path}")
        # 1. Trascrizione (Riconoscimento Vocale)
        # Whisper rileva automaticamente la lingua originale
        result = self.model.transcribe(audio_path)
        original_segments = result["segments"]
        detected_lang = result["language"]
        
        print(f"Lingua rilevata: {detected_lang}")

        # Prepariamo il file di log
        with open(log_file_path, "w", encoding="utf-8") as log_file:
            log_file.write(f"LOG TRADUZIONI - File: {audio_path}\n")
            log_file.write(f"Lingua Originale Rilevata: {detected_lang}\n")
            log_file.write("="*50 + "\n\n")

            # 2. Elaborazione per ogni lingua richiesta
            for lang in target_languages:
                print(f"Elaborazione lingua: {lang}")
                translated_segments = []
                
                translator = GoogleTranslator(source='auto', target=lang)

                for segment in original_segments:
                    start_time = format_timestamp(segment['start'])
                    end_time = format_timestamp(segment['end'])
                    original_text = segment['text'].strip()

                    # Traduzione
                    if lang == detected_lang:
                        translated_text = original_text
                    else:
                        try:
                            translated_text = translator.translate(original_text)
                        except Exception as e:
                            print(f"Errore traduzione segmento: {e}")
                            translated_text = original_text

                    # Aggiunta al log
                    log_entry = (
                        f"[{start_time} --> {end_time}]\n"
                        f"ORG ({detected_lang}): {original_text}\n"
                        f"TRA ({lang}): {translated_text}\n"
                        f"-"*20 + "\n"
                    )
                    log_file.write(log_entry)

                    # Creazione struttura per SRT
                    translated_segments.append({
                        'start': segment['start'],
                        'end': segment['end'],
                        'text': translated_text
                    })

                # 3. Scrittura file SRT
                srt_filename = f"{base_name}.{lang}.srt"
                srt_path = os.path.join(output_dir, srt_filename)
                write_srt(translated_segments, srt_path)
                print(f"Salvato sottotitolo: {srt_path}")

        print(f"Log salvato in: {log_file_path}")
        return output_dir
