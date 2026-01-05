import argparse
from .core import SubCats


def main():
    parser = argparse.ArgumentParser(prog="subcats", description="Genera sottotitoli multilingua da un file audio usando SubCats")
    parser.add_argument("audio", help="Percorso al file audio (mp3, wav, ogg, m4a, ...)")
    parser.add_argument("-l", "--langs", nargs="+", default=["it", "en"], help="Lingue target (es. it en es)")
    parser.add_argument("-o", "--output", default="./sottotitoli_output", help="Cartella di output")
    parser.add_argument("-m", "--model", default="base", help="Dimensione modello Whisper (tiny, base, small, medium, large)")
    parser.add_argument("--device", default="cpu", help="Dispositivo per il modello (cpu o cuda)")

    args = parser.parse_args()

    app = SubCats(model_size=args.model, device=args.device)
    app.generate_subtitles(
        audio_path=args.audio,
        target_languages=args.langs,
        output_dir=args.output,
    )


if __name__ == "__main__":
    main()
