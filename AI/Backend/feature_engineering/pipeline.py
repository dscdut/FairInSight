from __future__ import annotations

import argparse

from feature_engineering import cleaner, embedder, enricher, ingest, load_dataset, splitter

STEPS = {
    "load": load_dataset.run,
    "clean": cleaner.run,
    "split": splitter.run,
    "enrich": enricher.run,
    "embed": embedder.run,
    "ingest": ingest.run,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--step", choices=[*STEPS.keys(), "all"], default="all")
    args = parser.parse_args()

    if args.step == "all":
        for name in ["load", "clean", "split", "enrich", "embed", "ingest"]:
            print(f"Running step: {name}")
            STEPS[name]()  # type: ignore
    else:
        STEPS[args.step]()  # type: ignore


if __name__ == "__main__":
    main()
