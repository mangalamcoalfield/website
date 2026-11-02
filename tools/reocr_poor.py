"""Re-OCR the circulars whose scans read badly, trying several resolutions and image
clean-ups per page and keeping whichever reading scores best.

    python tools/reocr_poor.py <work_dir>                 # OCR and report; changes nothing
    python tools/reocr_poor.py <work_dir> --apply         # write the improved texts into the corpus
  options:
    --engines windows,rapidocr   OCR engines to try (default: every one available:
                                 windows = tools/ocr_pages.ps1, the Windows OCR the corpus
                                 was built with; rapidocr = pip install rapidocr-onnxruntime;
                                 tesseract if it is on PATH)
    --dpi 200,300,400,600        render resolutions
    --threshold 0.6              which circulars count as poor (tools/ocr_quality.py score)
    --pdf-dir DIR                read PDFs from DIR (by file name) instead of downloading
    --only ID[,ID]               just these circular ids

Writes <work_dir>/reocr/report.md (before/after per circular and the winning
variant per page) and report.json. --apply replaces a circular's text only where the
new reading scores at least 0.10 higher, runs it through the same clean-up as the
builders (contact details, Gazette headers, line joining), and re-scores it. Ids,
titles and references are not touched. Needs: pymupdf, pillow.
"""
import argparse, json, os, re, shutil, subprocess, sys, urllib.request
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
CORPUS = os.path.join(ROOT, 'src', 'data', 'circulars-corpus.json')
PS1 = os.path.join(ROOT, 'tools', 'ocr_pages.ps1')


# ------------------------------------------------------------------ scoring
def vocabulary(entries):
    vocab = Counter(w for e in entries if not e['ocr'] for w in re.findall(r'[a-z]{3,}', e['text'].lower()))
    return {w for w, n in vocab.items() if n >= 3}


def score(text, known):
    """Share of words that are real words (as tools/ocr_quality.py), and the word count."""
    words = re.findall(r'[A-Za-z]{3,}', text)
    return (sum(1 for w in words if w.lower() in known) / len(words) if words else 0.0), len(words)


# ------------------------------------------------------------------ images
def variants(pix_png, name):
    """The page image and clean-ups of it: grey, stretched contrast + sharpened,
    and black-and-white at Otsu's threshold (good for faint typewriter scans)."""
    from io import BytesIO
    from PIL import Image, ImageFilter, ImageOps
    g = ImageOps.grayscale(Image.open(BytesIO(pix_png)))
    out = {'gray': g}
    out['contrast'] = ImageOps.autocontrast(g, cutoff=1).filter(ImageFilter.SHARPEN)
    hist = g.histogram()
    total = sum(hist); sum_all = sum(i * h for i, h in enumerate(hist))
    w_b = s_b = 0; best_t, best_v = 128, -1.0
    for t in range(256):
        w_b += hist[t]
        if not w_b or w_b == total:
            continue
        s_b += t * hist[t]
        m_b, m_f = s_b / w_b, (sum_all - s_b) / (total - w_b)
        v = w_b * (total - w_b) * (m_b - m_f) ** 2
        if v > best_v:
            best_t, best_v = t, v
    out['binary'] = g.point(lambda p: 255 if p > best_t else 0)
    return out


# ------------------------------------------------------------------ engines
def engine_windows(paths):
    """OCR a batch of PNGs with the Windows OCR script; returns {path: text}."""
    folders = {os.path.dirname(p) for p in paths}
    for f in folders:
        subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS1, '-InDir', f], check=True)
    return {p: open(os.path.splitext(p)[0] + '.txt', encoding='utf-8', errors='replace').read() if os.path.exists(os.path.splitext(p)[0] + '.txt') else '' for p in paths}


_rapid = None
def engine_rapidocr(paths):
    global _rapid
    if _rapid is None:
        from rapidocr_onnxruntime import RapidOCR
        _rapid = RapidOCR()
    out = {}
    for p in paths:
        res, _ = _rapid(p)
        boxes = sorted(((b[0][0][1], b[0][0][0], b[1]) for b in (res or [])))
        lines, last_y = [], None
        for y, x, t in boxes:                       # rows: boxes whose tops are within ~12 px
            if last_y is None or y - last_y > 12:
                lines.append([])
            lines[-1].append((x, t)); last_y = y
        out[p] = '\n'.join(' '.join(t for _, t in sorted(l)) for l in lines)
    return out


def engine_tesseract(paths):
    return {p: subprocess.run(['tesseract', p, '-', '--psm', '6'], capture_output=True, text=True).stdout for p in paths}


ENGINES = {'windows': engine_windows, 'rapidocr': engine_rapidocr, 'tesseract': engine_tesseract}


def available():
    have = []
    if os.name == 'nt' and os.path.exists(PS1):
        have.append('windows')
    try:
        import rapidocr_onnxruntime  # noqa: F401
        have.append('rapidocr')
    except ImportError:
        pass
    if shutil.which('tesseract'):
        have.append('tesseract')
    return have


# ------------------------------------------------------------------ main
def fetch(e, pdf_dir, dest):
    name = e['pdf'].split('#')[0].rsplit('/', 1)[-1]
    if pdf_dir:
        p = os.path.join(pdf_dir, name)
        if os.path.exists(p):
            return p
    p = os.path.join(dest, name)
    if not os.path.exists(p):
        urllib.request.urlretrieve(e['pdf'].split('#')[0], p)
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('work')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--engines')
    ap.add_argument('--dpi', default='200,300,400,600')
    ap.add_argument('--threshold', type=float, default=0.6)
    ap.add_argument('--pdf-dir')
    ap.add_argument('--only')
    a = ap.parse_args()
    import pymupdf

    entries = json.load(open(CORPUS, encoding='utf-8'))
    known = vocabulary(entries)
    poor = [e for e in entries if e['ocr'] and (e.get('ocr_quality') or 0) < a.threshold and e['set'] == 'library']
    if a.only:
        ids = set(a.only.split(','))
        poor = [e for e in poor if e['id'] in ids]
    engines = a.engines.split(',') if a.engines else available()
    if not engines:
        sys.exit('No OCR engine: on Windows tools/ocr_pages.ps1 is used; elsewhere pip install rapidocr-onnxruntime')
    dpis = [int(x) for x in a.dpi.split(',')]
    base = os.path.join(a.work, 'reocr'); os.makedirs(os.path.join(base, 'pdf'), exist_ok=True)
    print(f'{len(poor)} poor circulars · engines {engines} · dpi {dpis}')

    report = []
    for e in poor:
        pdf = fetch(e, a.pdf_dir, os.path.join(base, 'pdf'))
        doc = pymupdf.open(pdf)
        pages, chosen = [], []
        for pno in range(len(doc)):
            img_dir = os.path.join(base, 'img', e['id'], f'p{pno + 1:03d}')
            os.makedirs(img_dir, exist_ok=True)
            files = {}
            for dpi in dpis:
                png = doc[pno].get_pixmap(dpi=dpi).tobytes('png')
                for vname, im in variants(png, e['id']).items():
                    path = os.path.join(img_dir, f'{dpi}-{vname}.png')
                    if not os.path.exists(path):
                        im.save(path)
                    files[path] = (dpi, vname)
            best = ('', -1.0, 0, '')
            for eng in engines:
                for path, text in ENGINES[eng](list(files)).items():
                    s, n = score(text, known)
                    if (s, n) > (best[1], best[2]):
                        dpi, vname = files[path]
                        best = (text, s, n, f'{eng} {dpi}dpi {vname}')
            pages.append(best[0]); chosen.append(dict(page=pno + 1, variant=best[3], score=round(best[1], 3), words=best[2]))
        text = '\n'.join(pages)
        new, _ = score(text, known)
        report.append(dict(id=e['id'], ref=e['ref'], before=e.get('ocr_quality'), after=round(new, 3), pages=chosen, text=text))
        print(f"  {e['id'][:60]:60} {e.get('ocr_quality'):.2f} -> {new:.2f}  ({', '.join(c['variant'] for c in chosen)})")

    json.dump(report, open(os.path.join(base, 'report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(base, 'report.md'), 'w', encoding='utf-8') as f:
        f.write('| circular | before | after | winning variant per page |\n|---|---|---|---|\n')
        for r in report:
            f.write(f"| {r['id']} | {r['before']:.2f} | {r['after']:.2f} | {'; '.join(c['variant'] for c in r['pages'])} |\n")
    better = [r for r in report if r['after'] >= (r['before'] or 0) + 0.10]
    print(f'improved by 0.10 or more: {len(better)} of {len(report)} · now above {a.threshold}: '
          f"{sum(1 for r in report if r['after'] >= a.threshold)} · report: {os.path.join(base, 'report.md')}")

    if a.apply and better:
        from build_circular_corpus import clean
        import ocr_quality
        by_id = {r['id']: r for r in better}
        for e in entries:
            if e['id'] in by_id:
                e['text'] = clean(by_id[e['id']]['text'])
        ocr_quality.annotate(entries)
        json.dump(entries, open(CORPUS, 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)
        print(f'applied {len(better)} texts to {CORPUS}')


if __name__ == '__main__':
    main()
