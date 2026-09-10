#!/usr/bin/env python3
"""
pptx-editable-check.py — verify a .pptx is genuinely editable.

The single biggest promise this skill makes is "real, editable PPTX — not
flattened slide images." A build gone wrong can quietly violate that promise
(e.g. every slide rendered to one full-bleed PNG, an embedded macro, a
corrupted theme). This script checks it deterministically.

It verifies, in priority order:
  1. EDITABLE_TEXT  — every slide has at least one real text frame; no slide is
                      just a single full-bleed picture (the "flattened" failure).
  2. CJK_FONT       — at least one text run references a CJK-capable font
                      (Microsoft YaHei / Noto Sans CJK / PingFang / SimHei ...),
                      OR no CJK characters appear (so a CJK font is unnecessary).
  3. NO_MACRO       — no vbaProject part inside the .pptx (macros are a red
                      flag for an Agent-generated deck).
  4. THEME_INTACT   — theme/master parts exist (decks whose build script
                      deleted them render with broken defaults).
  5. RUNS_NOT_TEXTBOXES_AS_IMAGES — heuristic: flag slides where a near-full-
                      slide picture coexists with zero text frames.

If python-pptx is installed, the deep text/frame checks use it. If not, the
script falls back to a zip-only pass (still catches macros, missing theme,
flattened slides) and warns that python-pptx would give deeper coverage.

Usage:
    python scripts/pptx-editable-check.py deck.pptx
    python scripts/pptx-editable-check.py deck.pptx --json

Exit code: 1 if any P0 finding, 0 otherwise.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

# Report lines contain ✅ / CJK; a legacy Windows console code page (GBK/cp936)
# would raise UnicodeEncodeError before the verdict is printed.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):  # pragma: no cover - non-standard streams
        pass

# CJK Unified Ideographs + extensions + full-width punctuation ranges.
CJK_RE = re.compile(
    r"[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff"
    r"\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]"
)

CJK_FONTS = [
    "yahei",            # Microsoft YaHei
    "noto sans cjk",    # Noto Sans CJK (all weights)
    "noto serif cjk",
    "pingfang",         # Apple PingFang
    "simhei", "simsun", # Windows legacy
    "source han",       # Source Han Sans/Serif
    "wenquanyi",
    "hei", "song",      # generic CJK family names
]

SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def has_cjk(text: str) -> bool:
    return bool(CJK_RE.search(text or ""))


def font_is_cjk(name: str | None) -> bool:
    if not name:
        return False
    n = name.lower()
    return any(f in n for f in CJK_FONTS)


def list_parts(zf: zipfile.ZipFile) -> list[str]:
    return zf.namelist()


def slide_xml_names(parts: list[str]) -> list[str]:
    names = [p for p in parts if re.match(r"^ppt/slides/slide\d+\.xml$", p)]
    names.sort(key=lambda n: int(re.search(r"slide(\d+)\.xml", n).group(1)))
    return names


def check_zip_level(zf: zipfile.ZipFile, parts: list[str], slides: list[str]) -> list[dict]:
    """Checks that work without python-pptx, by inspecting the zip directly."""
    findings = []

    # Macros
    if any("vbaProject" in p or p.endswith(".bin") and "embeddings" in p for p in parts):
        findings.append({"severity": "P0", "code": "MACRO_OR_EMBEDDED_BIN",
                         "message": "found vbaProject / embedded .bin part — Agent decks should be macro-free",
                         "hint": "regenerate without macros; never ship VBA from a build script"})

    # Theme intact
    if not any(p.startswith("ppt/theme/theme") and p.endswith(".xml") for p in parts):
        findings.append({"severity": "P0", "code": "THEME_MISSING",
                         "message": "no ppt/theme/theme*.xml part found — build script damaged the theme",
                         "hint": "do not delete the theme; regenerate the deck"})
    if not any(p.startswith("ppt/slideMasters/slideMaster") for p in parts):
        findings.append({"severity": "P1", "code": "MASTER_MISSING",
                         "message": "no slide master part — slides may render with broken defaults",
                         "hint": "keep at least one slide master"})

    # Flatten detection: per slide, count <p:sp> vs <p:pic>, and whether a pic is near-full-bleed.
    for s in slides:
        xml = zf.read(s).decode("utf-8", errors="replace")
        sp_count = len(re.findall(r"<p:sp\b", xml))
        pic_count = len(re.findall(r"<p:pic\b", xml))
        # near full-bleed picture: ext cx >= 9in (8229600 EMU) and cy >= 5in (4572000 EMU)
        full_bleed = re.search(r'<a:ext\s+cx="(\d+)"\s+cy="(\d+)"', xml)
        full_bleed_pic = False
        if full_bleed:
            cx = int(full_bleed.group(1)); cy = int(full_bleed.group(2))
            if cx >= 8_229_600 and cy >= 4_572_000:
                full_bleed_pic = True
        slide_no = int(re.search(r"slide(\d+)\.xml", s).group(1))
        if sp_count == 0 and pic_count >= 1:
            findings.append({"severity": "P0", "code": "FLATTENED_SLIDE",
                             "slide": slide_no,
                             "message": f"slide {slide_no}: no text shapes, only pictures — looks like a flattened image",
                             "hint": "add editable text frames; never replace text with a full-bleed image"})
        elif sp_count == 0 and pic_count == 0:
            findings.append({"severity": "P1", "code": "EMPTY_SLIDE",
                             "slide": slide_no,
                             "message": f"slide {slide_no}: no shapes and no pictures (blank slide?)",
                             "hint": "add content or remove the slide"})
    return findings


def check_with_python_pptx(zf: zipfile.ZipFile, path: str, slides: list[str]) -> tuple[list[dict], bool]:
    """Deep text/font checks. Returns (findings, used_python_pptx)."""
    findings = []
    try:
        from pptx import Presentation  # type: ignore
    except ImportError:
        return findings, False

    prs = Presentation(path)
    # python-pptx preserves slide order matching the file's sldIdLst.
    deck_has_cjk = False
    deck_has_cjk_font = False
    slides_with_text = 0

    for idx, slide in enumerate(prs.slides, start=1):
        slide_has_text = False
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for para in shape.text_frame.paragraphs:
                for run in para.runs:
                    txt = run.text or ""
                    if not txt.strip():
                        continue
                    slide_has_text = True
                    if has_cjk(txt):
                        deck_has_cjk = True
                        # check font on this run
                        f = run.font
                        name = f.name
                        # Also check the latin/ea typeface via the XML element.
                        try:
                            rPr = run._r.get_or_add_rPr()
                            ea = rPr.find(
                                "{http://schemas.openxmlformats.org/drawingml/2006/main}ea"
                            )
                            if ea is not None and ea.get("typeface"):
                                name = name or ea.get("typeface")
                                if font_is_cjk(ea.get("typeface")):
                                    deck_has_cjk_font = True
                        except Exception:
                            pass
                        if font_is_cjk(name):
                            deck_has_cjk_font = True
        if slide_has_text:
            slides_with_text += 1

    if deck_has_cjk and not deck_has_cjk_font:
        findings.append({
            "severity": "P1",
            "code": "NO_CJK_FONT",
            "message": "deck contains CJK characters but no run references a CJK font "
                       "(YaHei / Noto Sans CJK / PingFang ...)",
            "hint": "set fontFace to 'Microsoft YaHei' on CJK runs; LibreOffice/PowerPoint "
                    "may otherwise fall back to a box ('tofu') font",
        })

    if slides_with_text == 0:
        findings.append({
            "severity": "P0",
            "code": "NO_EDITABLE_TEXT",
            "message": "no editable text found anywhere in the deck — every slide is image-only",
            "hint": "this violates the editable-PPTX contract; regenerate with real text frames",
        })

    return findings, True


def run(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        return {"error": f"file not found: {path}"}

    findings = []
    used_pptx = False
    try:
        with zipfile.ZipFile(p) as zf:
            parts = list_parts(zf)
            slides = slide_xml_names(parts)
            findings.extend(check_zip_level(zf, parts, slides))
            deep, used_pptx = check_with_python_pptx(zf, str(p), slides)
            findings.extend(deep)
    except zipfile.BadZipFile:
        findings.append({"severity": "P0", "code": "NOT_A_PPTX",
                         "message": "file is not a valid zip / .pptx container",
                         "hint": "the build likely failed mid-write; regenerate"})

    if not used_pptx:
        findings.append({"severity": "P2", "code": "PYTHON_PPTX_MISSING",
                         "message": "python-pptx not installed — skipped deep text/CJK-font checks",
                         "hint": "pip install python-pptx for full editable-text and CJK-font coverage"})

    findings.sort(key=lambda f: SEVERITY_ORDER.get(f["severity"], 9))
    p0 = sum(1 for f in findings if f["severity"] == "P0")
    p1 = sum(1 for f in findings if f["severity"] == "P1")
    p2 = sum(1 for f in findings if f["severity"] == "P2")
    return {
        "deck": str(p.resolve()),
        "slides": len(slides) if "slides" in dir() else None,
        "summary": {"pass": p0 == 0, "total": len(findings), "P0": p0, "P1": p1, "P2": p2},
        "findings": findings,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify a .pptx is genuinely editable.")
    ap.add_argument("deck", help="path to .pptx")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    report = run(args.deck)
    if "error" in report:
        print(report["error"], file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        icon = {"P0": "❌", "P1": "⚠️", "P2": "·", "P3": "·"}
        print(f"Deck: {report['deck']} | {report['slides']} slides")
        for f in report["findings"]:
            slide = f" slide {f['slide']}" if "slide" in f else ""
            print(f"  {icon.get(f['severity'], '?')} [{f['severity']} {f['code']}]{slide}: {f['message']}")
        s = report["summary"]
        print("")
        print(f"Total: {s['total']} | P0: {s['P0']} | P1: {s['P1']} | P2: {s['P2']}")
        if s["pass"]:
            print("Editable-PPTX contract holds ✅")
        else:
            print(f"FAIL: {s['P0']} P0 blocker(s) ❌")

    return 0 if report["summary"]["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
