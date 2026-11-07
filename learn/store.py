from __future__ import annotations

import fcntl
import json
import os
from pathlib import Path
from typing import Any, Iterator

from learn import SCHEMA_VERSION, STORE_KIND
from learn.ids import canonical
from learn.schema import ValidationError, validate_event


class StoreError(RuntimeError):
    pass


class StoreLock:
    """Process-level exclusive lock (fcntl.LOCK_EX) held for the critical section."""

    def __init__(self, path: Path):
        self.path = path
        self.fd: int | None = None

    def __enter__(self) -> "StoreLock":
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.fd = os.open(self.path, os.O_CREAT | os.O_RDWR, 0o644)
        fcntl.flock(self.fd, fcntl.LOCK_EX)
        os.lseek(self.fd, 0, os.SEEK_SET)
        os.ftruncate(self.fd, 0)
        os.write(self.fd, f"{os.getpid()}\n".encode("ascii"))
        os.fsync(self.fd)
        return self

    def __exit__(self, *exc: object) -> None:
        if self.fd is None:
            return
        try:
            fcntl.flock(self.fd, fcntl.LOCK_UN)
        finally:
            os.close(self.fd)
            self.fd = None


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(text)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, path)
        dirfd = os.open(str(path.parent), os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(dirfd)
        finally:
            os.close(dirfd)
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)


class Store:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.events_path = self.root / "events.jsonl"
        self.corrupt_path = self.root / "events.jsonl.corrupt"
        self.manifest_path = self.root / "manifest.json"
        self.success_path = self.root / "last_success.json"
        self.lock_path = self.root / "store.lock"

    def lock(self) -> StoreLock:
        return StoreLock(self.lock_path)

    def ensure(self) -> None:
        self.root.mkdir(parents=True, exist_ok=True)
        if not self.manifest_path.exists():
            self.write_manifest({"kind": STORE_KIND, "schema_version": SCHEMA_VERSION})

    def write_manifest(self, data: dict[str, Any]) -> None:
        data = {**data, "kind": STORE_KIND, "schema_version": SCHEMA_VERSION}
        atomic_write_text(self.manifest_path, canonical(data) + "\n")

    def read_manifest(self) -> dict[str, Any]:
        if not self.manifest_path.exists():
            return {"kind": STORE_KIND, "schema_version": SCHEMA_VERSION}
        raw = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        if raw.get("kind") not in (None, STORE_KIND):
            raise StoreError(f"manifest kind mismatch: {raw.get('kind')!r}")
        if raw.get("schema_version") not in (None, SCHEMA_VERSION):
            raise StoreError(f"unsupported store schema_version: {raw.get('schema_version')!r}")
        return raw

    def write_success(self, data: dict[str, Any]) -> None:
        atomic_write_text(self.success_path, canonical(data) + "\n")

    def read_success(self) -> dict[str, Any] | None:
        if not self.success_path.exists():
            return None
        return json.loads(self.success_path.read_text(encoding="utf-8"))

    def iter_raw_lines(self) -> Iterator[tuple[int, str]]:
        if not self.events_path.exists():
            return
        with self.events_path.open("r", encoding="utf-8") as fh:
            for i, line in enumerate(fh, 1):
                yield i, line

    def load_events(self) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        corrupt = 0
        for _i, line in self.iter_raw_lines() or []:
            text = line.strip()
            if not text:
                continue
            try:
                obj = json.loads(text)
                events.append(validate_event(obj))
            except (json.JSONDecodeError, ValidationError, TypeError):
                corrupt += 1
        if corrupt:
            raise StoreError(
                f"{corrupt} corrupt or invalid line(s) in {self.events_path}; "
                "run `python3 -m learn repair --store ...` before export"
            )
        return events

    def try_load_events(self) -> tuple[list[dict[str, Any]], list[tuple[int, str]]]:
        """Return valid events plus (line_no, text) of rejected lines. Does not raise."""
        events: list[dict[str, Any]] = []
        bad: list[tuple[int, str]] = []
        for i, line in list(self.iter_raw_lines() or []):
            text = line.strip()
            if not text:
                continue
            try:
                events.append(validate_event(json.loads(text)))
            except (json.JSONDecodeError, ValidationError, TypeError):
                bad.append((i, line if line.endswith("\n") else line + "\n"))
        return events, bad

    def append_events(self, new_events: list[dict[str, Any]]) -> dict[str, int]:
        """Idempotent append: skip event_ids already present. Atomic rewrite."""
        existing = []
        if self.events_path.exists():
            existing = self.load_events()
        seen = {e["event_id"] for e in existing}
        written = 0
        skipped = 0
        accepted: list[dict[str, Any]] = []
        for event in new_events:
            event = validate_event(event)
            if event["event_id"] in seen:
                skipped += 1
                continue
            seen.add(event["event_id"])
            accepted.append(event)
            written += 1
        if accepted:
            lines = [json.dumps(e, ensure_ascii=True, sort_keys=True) + "\n" for e in existing + accepted]
            atomic_write_text(self.events_path, "".join(lines))
        return {"written": written, "skipped": skipped, "total": len(existing) + written}

    def repair(self) -> dict[str, int]:
        events, bad = self.try_load_events()
        if bad:
            prev = self.corrupt_path.read_text(encoding="utf-8") if self.corrupt_path.exists() else ""
            extra = "".join(text if text.endswith("\n") else text + "\n" for _i, text in bad)
            atomic_write_text(self.corrupt_path, prev + extra)
        lines = [json.dumps(e, ensure_ascii=True, sort_keys=True) + "\n" for e in events]
        atomic_write_text(self.events_path, "".join(lines))
        return {"kept": len(events), "quarantined": len(bad)}
