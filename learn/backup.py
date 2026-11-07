from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path

from learn.store import Store, StoreError, atomic_write_text


BACKUP_FILES = ("events.jsonl", "manifest.json", "last_success.json", "events.jsonl.corrupt")


def _sha256_file(path: Path) -> str | None:
    if not path.exists():
        return None
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def backup(store: Store, dest: Path) -> dict:
    store.ensure()
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    checksums = {}
    with tarfile.open(dest, "w") as tar:
        for name in BACKUP_FILES:
            path = store.root / name
            if path.exists():
                tar.add(path, arcname=name)
                checksums[name] = _sha256_file(path)
        manifest = {
            "files": checksums,
            "store_root_name": store.root.name,
        }
        info_path = dest.with_suffix(dest.suffix + ".checksums.json")
        # include checksums inside the archive too
        tmp = store.root / ".backup-checksums.json"
        atomic_write_text(tmp, json.dumps(manifest, sort_keys=True) + "\n")
        try:
            tar.add(tmp, arcname="checksums.json")
        finally:
            tmp.unlink(missing_ok=True)
    return {"archive": str(dest), "files": checksums}


def restore(archive: Path, store: Store, *, verify: bool = True) -> dict:
    archive = Path(archive)
    if not archive.exists():
        raise StoreError(f"backup archive not found: {archive}")
    store.root.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "r") as tar:
        for member in tar.getmembers():
            name = Path(member.name).name
            if name not in set(BACKUP_FILES) | {"checksums.json"}:
                continue
            if not member.isfile():
                continue
            extracted = tar.extractfile(member)
            if extracted is None:
                continue
            data = extracted.read()
            target = store.root / name
            target.write_bytes(data)
    checksums = None
    cpath = store.root / "checksums.json"
    if cpath.exists():
        checksums = json.loads(cpath.read_text(encoding="utf-8")).get("files") or {}
        cpath.unlink()
    if verify:
        problems = []
        if checksums:
            for name, expected in checksums.items():
                actual = _sha256_file(store.root / name)
                if actual != expected:
                    problems.append(f"{name}: checksum mismatch")
        # structural verify: events load
        events = store.load_events() if (store.root / "events.jsonl").exists() else []
        if problems:
            raise StoreError("restore verification failed: " + "; ".join(problems))
        return {"restored": True, "events": len(events), "checksums_ok": True}
    return {"restored": True, "verified": False}
