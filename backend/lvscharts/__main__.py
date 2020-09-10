
if __name__ == "__main__":

    if __package__ is None:
        # add parent dir to allow relative import
        from pathlib import Path
        import sys

        top = Path(__file__).resolve().parents[1]
        sys.path.append(str(top))
        # PEP 0366
        __package__ = "lvscharts"
        __import__(__package__)
    from lvscharts.cli import cli
    cli()
