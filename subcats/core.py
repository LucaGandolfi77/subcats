import os
import whisper
from deep_translator import GoogleTranslator
from .utils import write_srt, format_timestamp
import logging


class SubCats:
    """High-level API for generating multilingual subtitles from audio files.

    This class wraps a Whisper model for transcription and uses Google Translate
    (via `deep_translator`) for target language translations.
    """

    def __init__(self, model_size="base", device="cpu"):
        """Initialize SubCats by loading a Whisper model.

        Args:
            model_size (str): Whisper model size ('tiny', 'base', 'small', 'medium', 'large').
            device (str): Device to run the model on ('cpu' or 'cuda').
        """
        print(f"Loading Whisper model '{model_size}' on {device}...")
        self.model = whisper.load_model(model_size, device=device)
        print("Model loaded.")

    def generate_subtitles(self, audio_path, target_languages=['en'], output_dir="output"):
        """Generate subtitle files (.srt) and a translation log for an audio file.

        The method transcribes the input audio using Whisper, detects the source
        language automatically, translates each segment into requested target
        languages, and writes SRT files plus a combined translation log.

        Args:
            audio_path (str): Path to the audio file.
            target_languages (list): List of language codes for translation (e.g. ['it','en','es']).
            output_dir (str): Directory where output files will be saved.

        Returns:
            str: The output directory path.
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        log_file_path = os.path.join(output_dir, f"{base_name}_translation_log.txt")

        print(f"Starting transcription of: {audio_path}")
        # 1. Transcription (ASR) - Whisper auto-detects the source language
        result = self.model.transcribe(audio_path)
        original_segments = result["segments"]
        detected_lang = result["language"]

        print(f"Detected language: {detected_lang}")

        # Prepare the translation log
        with open(log_file_path, "w", encoding="utf-8") as log_file:
            log_file.write(f"TRANSLATION LOG - File: {audio_path}\n")
            log_file.write(f"Detected Source Language: {detected_lang}\n")
            log_file.write("=" * 50 + "\n\n")

            # 2. Process each requested language
            for lang in target_languages:
                print(f"Processing target language: {lang}")
                translated_segments = []

                translator = GoogleTranslator(source='auto', target=lang)

                for segment in original_segments:
                    start_time = format_timestamp(segment['start'])
                    end_time = format_timestamp(segment['end'])
                    original_text = segment['text'].strip()

                    # Translation (skip if same language)
                    if lang == detected_lang:
                        translated_text = original_text
                    else:
                        try:
                            translated_text = translator.translate(original_text)
                        except Exception as e:
                            print(f"Translation error for segment: {e}")
                            translated_text = original_text

                    # Append to the human-readable log
                    log_entry = (
                        f"[{start_time} --> {end_time}]\n"
                        f"SRC ({detected_lang}): {original_text}\n"
                        f"TRG ({lang}): {translated_text}\n"
                        + ("-" * 20) + "\n"
                    )
                    log_file.write(log_entry)

                    # Build structure for SRT
                    translated_segments.append({
                        'start': segment['start'],
                        'end': segment['end'],
                        'text': translated_text
                    })

                # 3. Write SRT file for this language
                srt_filename = f"{base_name}.{lang}.srt"
                srt_path = os.path.join(output_dir, srt_filename)
                write_srt(translated_segments, srt_path)
                print(f"Saved subtitle: {srt_path}")

        print(f"Log saved to: {log_file_path}")
        return output_dir
