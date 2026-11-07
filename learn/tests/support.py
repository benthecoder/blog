from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"


def fx(name: str) -> Path:
    return FIXTURES / name


def write_json(path: Path, obj) -> Path:
    path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    return path
