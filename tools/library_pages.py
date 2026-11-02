"""Text of every DGMS circular and notification held as an individual PDF in the
regulations library (the ones the two compilations don't cover — everything after
Dec 2024, plus older ones DGMS never compiled). Scanned pages go through Windows OCR.

    python tools/library_pages.py <work_dir>

Writes <work_dir>/pages_library.json = {slug: [{"page": n, "text": "...", "ocr": bool}, ...]}
OCR is cached in <work_dir>/ocr_library/ as <slug>__p0001.png/.txt, so re-runs are cheap.
"""
import json, os, re, subprocess, sys
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The source archive lives outside the repo; set MINING_REGULATION_DIR on another machine.
SRC = os.environ.get('MINING_REGULATION_DIR', r'C:\Users\Mangalam\Mining Regulation')
OCR_PS1 = os.path.join(ROOT, 'tools', 'ocr_pages.ps1')
CATEGORIES = {'dgms_circular', 'dgms_notification'}
# `--regulations` selects every other library category instead (Acts, Rules, Codes,
# CMR 2017, MMDR, environment, Ministry of Coal, CEA, drafts) for the regulations index.
REGULATIONS = '--regulations' in sys.argv
# The compilations are listed in the library too, but are split up separately.
COMPILATIONS = {'CIRCULARSNew_19092025.pdf', 'DGMScircularsfrom20182024_06122024.pdf'}

def content_chars(t):
    return len(re.sub(r'\s', '', t))

def main(work):
    seed = json.load(open(os.path.join(ROOT, 'src', 'data', 'regulations-full-seed.json'), encoding='utf-8'))
    idx = {}
    for dp, _, fs in os.walk(SRC):
        for f in fs:
            if f.lower().endswith('.pdf') and f not in idx:
                idx[f] = os.path.join(dp, f)
    pick = (lambda c: c not in CATEGORIES) if REGULATIONS else (lambda c: c in CATEGORIES)
    rows = [r for r in seed if r.get('published') and pick(r.get('category'))
            and os.path.basename(r.get('source_filename') or '') not in COMPILATIONS]
    cache = os.path.join(work, 'ocr_regulations' if REGULATIONS else 'ocr_library')
    os.makedirs(cache, exist_ok=True)
    docs, need, skipped = {}, 0, []
    for r in rows:
        p = idx.get(os.path.basename(r.get('source_filename') or ''))
        if not p:
            skipped.append((r['slug'], 'no local file')); continue
        try:
            d = pymupdf.open(p)
            n = d.page_count
        except Exception as e:
            skipped.append((r['slug'], f'unreadable: {e}')); continue
        pages = []
        for i in range(n):
            pg = d[i]
            t = pg.get_text()
            png = os.path.join(cache, f"{r['slug']}__p{i + 1:04d}.png")
            if content_chars(t) < 200 and pg.get_images():
                if not os.path.exists(png):
                    pg.get_pixmap(dpi=220, colorspace=pymupdf.csGRAY).save(png)
                need += 1
            pages.append({'page': i + 1, 'text': t, 'png': png if os.path.exists(png) else None})
        docs[r['slug']] = pages
    print(f'library: {len(docs)} documents, {sum(len(v) for v in docs.values())} pages, {need} need OCR; skipped {skipped}', flush=True)
    if need:
        subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OCR_PS1, '-InDir', cache], check=True)
    out = {}
    for slug, pages in docs.items():
        res = []
        for p in pages:
            txt, ocr = p['text'], False
            if p['png']:
                tf = p['png'][:-4] + '.txt'
                if os.path.exists(tf):
                    o = open(tf, encoding='utf-8').read()
                    if content_chars(o) > content_chars(txt):
                        txt, ocr = o, True
            res.append({'page': p['page'], 'text': txt, 'ocr': ocr})
        out[slug] = res
    name = 'pages_regulations.json' if REGULATIONS else 'pages_library.json'
    json.dump(out, open(os.path.join(work, name), 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'library: wrote {name} ({sum(q["ocr"] for v in out.values() for q in v)} OCR pages)', flush=True)

if __name__ == '__main__':
    main([a for a in sys.argv[1:] if not a.startswith('--')][0])
