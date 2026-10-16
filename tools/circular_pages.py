"""Stage 1 of the circular corpus: get the text of every page of the DGMS circular
compilations, using the PDF text layer where it exists and Windows OCR
(tools/ocr_pages.ps1) for scanned pages.

    python tools/circular_pages.py <work_dir>

Writes <work_dir>/pages_<key>.json = [{"page": n, "text": "...", "ocr": bool}, ...]
OCR is cached in <work_dir>/ocr_<key>/ (PNG + TXT per page), so re-runs are cheap.
"""
import json, os, re, subprocess, sys
import pymupdf

REG = r'C:\Users\Mangalam\Mining Regulation\sources\dgms_archive'
SOURCES = {
    'upto2017': os.path.join(REG, 'CIRCULARSNew_19092025.pdf'),
    '2018_2024': os.path.join(REG, 'DGMScircularsfrom20182024_06122024.pdf'),
}
OCR_PS1 = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_pages.ps1')

def content_chars(t: str) -> int:
    # Running headers ("ISN", "DGMS") and page numbers are on every page; ignore them.
    return len(re.sub(r'\s|ISN|DGMS|\d', '', t))

def main(work):
    os.makedirs(work, exist_ok=True)
    for key, pdf in SOURCES.items():
        doc = pymupdf.open(pdf)
        cache = os.path.join(work, f'ocr_{key}')
        os.makedirs(cache, exist_ok=True)
        need = []
        for i, page in enumerate(doc):
            if content_chars(page.get_text()) < 300 and page.get_images():
                png = os.path.join(cache, f'p{i + 1:04d}.png')
                if not os.path.exists(png):
                    page.get_pixmap(dpi=220, colorspace=pymupdf.csGRAY).save(png)
                need.append(i + 1)
        print(f'{key}: {len(doc)} pages, {len(need)} need OCR', flush=True)
        if need:
            subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OCR_PS1, '-InDir', cache], check=True)
        out = []
        for i, page in enumerate(doc):
            n = i + 1
            txt = page.get_text()
            ocr = False
            tf = os.path.join(cache, f'p{n:04d}.txt')
            if n in need and os.path.exists(tf):
                o = open(tf, encoding='utf-8').read()
                if content_chars(o) > content_chars(txt):
                    txt, ocr = o, True
            out.append({'page': n, 'text': txt, 'ocr': ocr})
        json.dump(out, open(os.path.join(work, f'pages_{key}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'{key}: wrote pages_{key}.json ({sum(p["ocr"] for p in out)} OCR pages)', flush=True)

if __name__ == '__main__':
    main(sys.argv[1])
