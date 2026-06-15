#!/usr/bin/env python3
"""Sync Backend/requirements.runtime.txt from project.dependencies in pyproject.toml."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import tomllib


def build_requirements_content(pyproject_path: Path) -> str:
    data = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    deps = data.get("project", {}).get("dependencies", [])

    if not isinstance(deps, list):
        raise ValueError("project.dependencies must be a list")

    for dep in deps:
        if not isinstance(dep, str) or not dep.strip():
            raise ValueError("Each dependency must be a non-empty string")

    lines = [
        "# Auto-generated from pyproject.toml [project.dependencies]",
        "# Do not edit manually. Run: make sync-runtime-requirements",
        *deps,
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync requirements.runtime.txt from pyproject.toml project dependencies."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if requirements.runtime.txt is out of sync.",
    )
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parents[1]
    pyproject_path = backend_dir / "pyproject.toml"
    requirements_path = backend_dir / "requirements.runtime.txt"

    expected = build_requirements_content(pyproject_path)
    current = requirements_path.read_text(encoding="utf-8") if requirements_path.exists() else ""

    if args.check:
        if current != expected:
            print("requirements.runtime.txt is out of sync.")
            print("Run: make sync-runtime-requirements")
            return 1
        print("requirements.runtime.txt is in sync.")
        return 0

    requirements_path.write_text(expected, encoding="utf-8")
    print(f"Synced {requirements_path} from {pyproject_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
