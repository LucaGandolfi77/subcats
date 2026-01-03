from setuptools import setup, find_packages

setup(
    name="SubCats",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "openai-whisper",
        "deep-translator",
        "torch",
        "numpy"
    ],
    entry_points={
        'console_scripts': [
            'subcats=subcats.cli:main',
        ],
    },
    author="GitHub Copilot User",
    description="Libreria per generazione automatica di sottotitoli e traduzioni da audio.",
)
