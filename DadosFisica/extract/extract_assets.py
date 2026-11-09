#!/usr/bin/env python3
"""
Extract reusable visual assets from the UEL "INDICADORES DA GRADUAÇÃO" reports.

The .xlsx files store every indicator (evasão, reprovação, perfil, ...) as flat
PNG/JPG *images* anchored to cells on the ALUNOS_ATIVOS_FORMADOS sheet — there are
no chart objects and almost no numeric cells. The .pdf is the same report, with
the tables likewise rendered as images. So the numbers cannot be parsed as text;
they have to be read off the pictures.

This script does two things, per source file:

  1. Pull the embedded images out of each .xlsx and tag them with the sheet row
     they are anchored to (the row tells us which indicator they belong to).
  2. Render each .pdf page to a PNG, as a clean full-page reference for
     transcription.

Output goes to extract/images/<program>/<year>/...

Run:  python3 extract/extract_assets.py
"""
from __future__ import annotations
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
import subprocess
import re

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw"
OUT = ROOT / "extract" / "images"

NS = {
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
EMBED = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"


def year_of(name: str) -> str:
    m = re.search(r"_(\d{4})", name)
    return m.group(1) if m else "????"


def extract_xlsx_images(xlsx: Path, dest: Path) -> list[tuple[int, str]]:
    """Save embedded images; return [(anchor_row, saved_filename), ...]."""
    dest.mkdir(parents=True, exist_ok=True)
    mapping: list[tuple[int, str]] = []
    with zipfile.ZipFile(xlsx) as z:
        names = z.namelist()
        for drawing in [n for n in names if re.fullmatch(r"xl/drawings/drawing\d+\.xml", n)]:
            rels_path = drawing.replace("drawings/", "drawings/_rels/") + ".rels"
            rels = {}
            if rels_path in names:
                for rel in ET.fromstring(z.read(rels_path)):
                    rels[rel.get("Id")] = rel.get("Target").split("/")[-1]
            root = ET.fromstring(z.read(drawing))
            for anchor in root:
                frm = anchor.find("xdr:from", NS)
                row = int(frm.find("xdr:row", NS).text) if frm is not None else -1
                rid = None
                for blip in anchor.iter("{%s}blip" % NS["a"]):
                    rid = blip.get(EMBED)
                if rid is None or rid not in rels:
                    continue
                media = rels[rid]
                data = z.read("xl/media/" + media)
                ext = Path(media).suffix
                out_name = f"row{row:03d}_{Path(media).stem}{ext}"
                (dest / out_name).write_bytes(data)
                mapping.append((row, out_name))
    return mapping


def render_pdf(pdf: Path, dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    # pdftoppm: one PNG per page at 200 dpi
    subprocess.run(
        ["pdftoppm", "-r", "200", "-png", str(pdf), str(dest / "page")],
        check=True,
    )


def main() -> None:
    for program_dir in sorted(RAW.iterdir()):
        if not program_dir.is_dir():
            continue
        for f in sorted(program_dir.iterdir()):
            year = year_of(f.name)
            dest = OUT / program_dir.name / year
            if f.suffix == ".xlsx":
                mapping = extract_xlsx_images(f, dest / "xlsx_images")
                index = dest / "xlsx_images" / "_anchor_index.tsv"
                index.write_text(
                    "anchor_row\timage\n"
                    + "".join(f"{r}\t{n}\n" for r, n in sorted(mapping))
                )
                print(f"{f.name}: {len(mapping)} images -> {index.parent}")
            elif f.suffix == ".pdf":
                render_pdf(f, dest / "pdf_pages")
                print(f"{f.name}: rendered pages -> {dest / 'pdf_pages'}")


if __name__ == "__main__":
    main()
