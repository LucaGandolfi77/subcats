import argparse
from .core import SubCats


def main():
    """CLI entry point for SubCats.

    Parses arguments and runs subtitle generation for the provided audio file.
    """
    parser = argparse.ArgumentParser(prog="subcats", description="Generate multilingual subtitles from an audio file using SubCats")
    parser.add_argument("audio", help="Path to the audio file (mp3, wav, ogg, m4a, ...)")
    parser.add_argument("-l", "--langs", nargs="+", default=["it", "en"], help="Target languages (e.g. it en es)")
    parser.add_argument("-o", "--output", default="./sottotitoli_output", help="Output directory")
    parser.add_argument("-m", "--model", default="base", help="Whisper model size (tiny, base, small, medium, large)")
    parser.add_argument("--device", default="cpu", help="Device for the model (cpu or cuda)")

    args = parser.parse_args()

    app = SubCats(model_size=args.model, device=args.device)
    app.generate_subtitles(
        audio_path=args.audio,
        target_languages=args.langs,
        output_dir=args.output,
    )


if __name__ == "__main__":
    main()
