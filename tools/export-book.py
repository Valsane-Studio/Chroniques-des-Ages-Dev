#!/usr/bin/env python3
"""Exporte un livre de Chroniques des Âges dans un ZIP autonome."""

from pathlib import Path
import shutil
import zipfile
import re
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]

if len(sys.argv) != 2:
    raise SystemExit("Usage : python tools/export-book.py <NomDuDossierLivre>")

folder = sys.argv[1]
book_dir = ROOT / "books" / folder
manifest = book_dir / "manifest.js"

if not manifest.exists():
    raise SystemExit(f"Manifest introuvable : {manifest}")

text = manifest.read_text(encoding="utf-8")
match = re.search(r"\bid\s*:\s*['\"]([^'\"]+)['\"]", text)
if not match:
    raise SystemExit("Impossible de lire l'id du livre dans manifest.js")

book_id = match.group(1)
exports = ROOT / "exports"
exports.mkdir(exist_ok=True)
zip_path = exports / f"{folder}-Standalone.zip"

with tempfile.TemporaryDirectory() as temp:
    out = Path(temp) / folder
    out.mkdir()

    for filename in ("index.html", "manifest.webmanifest", "sw.js"):
        shutil.copy2(ROOT / filename, out / filename)

    shutil.copytree(ROOT / "engine", out / "engine")
    shutil.copytree(ROOT / "app", out / "app")
    shutil.copytree(ROOT / "styles", out / "styles")
    shutil.copytree(book_dir, out / "books" / folder)

    catalog = f"""window.LIBRARY_CONFIG = {{
  version: 1,
  studio: 'Valsane Studio',
  collection: 'Chroniques des Âges',
  standalone: true,
  books: [
    {{ id: '{book_id}', folder: '{folder}', order: 1, visible: true }}
  ]
}};
"""
    (out / "app" / "catalog.js").write_text(catalog, encoding="utf-8")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in out.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(out))

print(zip_path)
