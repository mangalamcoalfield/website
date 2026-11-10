"""Recover the section headings of a Hindi Gazette text that prints them in the
margin, by OCR of the margin notes, and set them on its Hindi corpus entry.

    python tools/hindi_margin_headings.py <hindi-pdf> <hindi-slug>            # report
    python tools/hindi_margin_headings.py <hindi-pdf> <hindi-slug> --apply    # write

Written for the OSH&WC Code, 2020 (oshwc-code-2020-hindi). Its PDF has a text layer
in a Unicode font whose glyph mapping is damaged ("कतषव्य" for "कर्तव्य", "ि" for
ख, क्ष and ल), so the words can't be taken from it; but the layer still says where
each margin note is. So:

  * margin lines are those wholly left of x=112 or right of x=488.5 below the
    running header, other than Act citations ("1961 का 52");
  * lines in the same margin, one under the next, join into a note, which ends at
    its "।";
  * each note is rendered at 500 dpi and read with Tesseract (Hindi, -l hin);
  * the usual OCR slips are corrected (halants dropped from द्व, द्य, द्ध, द्भ; "|"
    read for "।"; stray dots);
  * notes go to sections in order, one each, and only when their count equals the
    number of sections; otherwise nothing is written.

Needs pymupdf and tesseract with Hindi data (apt-get install tesseract-ocr
tesseract-ocr-hin). Section numbers, anchors and text don't change.
"""
import json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
CITATION = re.compile(r'^\s*\d{4}\s*का\s*\d{1,3}\s*$')
FIXES = [
    (r'\s*[|।]\s*$', ''), (r'(?<=[ऀ-ॿ])\.+(?=\s|$)', ''), (r'\s+\.\s+', ' '), (r'\s+\|\s+', ' '),
    ('औदयोगिक', 'औद्योगिक'), ('दवारा', 'द्वारा'), ('आबदधकर', 'आबद्धकर'), ('सदभावपूर्वक', 'सद्भावपूर्वक'),
    (' कया ', ' क्या '), ('अनुजञप्ति', 'अनुज्ञप्ति'), ('अनुज़प्ति', 'अनुज्ञप्ति'), ('अनुजप्त', 'अनुज्ञप्त'),
    ('अनुज्ेय', 'अनुज्ञेय'), ('रिपोर्टो ', 'रिपोर्टों '), ('संक्षिपतत', 'संक्षिप्त'), ('निर्बधन', 'निर्बंधन'),
    ('उच्चछनन्‍नता', 'उच्चछन्नता'), ('आसनन्‍न', 'आसन्न'), ('‌', ''), ('‍', ''),
    ('सह- सुकारक', 'सह-सुकारक'), ('निरीक्षक- सह', 'निरीक्षक-सह'), (' मे ', ' में '), (r'\s{2,}', ' '),
]
# Notes the OCR can't read from the crop, as the text layer gives them (checked by eye).
KNOWN = {'सुरिा ।': 'सुरक्षा'}


def margin_notes(doc):
    out = []
    for pn, page in enumerate(doc):
        ls = []
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                t = ''.join(s['text'] for s in l['spans']).strip()
                x0, y0, x1, y1 = l['bbox']
                if t and y0 > 60 and l['spans'][0]['size'] <= 12.5 and (x1 < 112 or x0 > 488.5) and not CITATION.match(t):
                    ls.append((x0, y0, x1, y1, t))
        ls.sort(key=lambda l: (l[0] > 300, l[1], l[0]))
        cur = None
        for l in ls:
            side = l[0] > 300
            if cur and cur['side'] == side and l[1] - cur['y1'] < 4 and not cur['text'].rstrip().endswith('।'):
                cur.update(y1=max(cur['y1'], l[3]), x0=min(cur['x0'], l[0]), x1=max(cur['x1'], l[2]), text=cur['text'] + ' ' + l[4])
            else:
                if cur:
                    out.append(cur)
                cur = dict(page=pn, side=side, x0=l[0], y0=l[1], x1=l[2], y1=l[3], text=l[4])
        if cur:
            out.append(cur)
    return out


def read(doc, n, tmp):
    import pymupdf
    if n['text'].strip() in KNOWN:
        return KNOWN[n['text'].strip()]
    clip = pymupdf.Rect(n['x0'] - 3, n['y0'] - 2, n['x1'] + 3, n['y1'] + 2)
    png = os.path.join(tmp, 'note.png')
    doc[n['page']].get_pixmap(clip=clip, dpi=500, colorspace=pymupdf.csGRAY).save(png)
    t = subprocess.run(['tesseract', png, '-', '-l', 'hin', '--psm', '6'], capture_output=True, text=True, check=True).stdout
    t = re.sub(r'\s+', ' ', t).strip()
    for a, b in FIXES:
        t = re.sub(a, b, t)
    return t.strip(' .')


def main():
    args = [a for a in sys.argv[1:] if a != '--apply']
    if len(args) != 2:
        sys.exit(__doc__)
    import pymupdf
    pdf, slug = args
    doc = pymupdf.open(pdf)
    notes = margin_notes(doc)
    docs = json.load(open(CORPUS, encoding='utf-8'))
    hi = next(d for d in docs if d['slug'] == slug)
    secs = [p for p in hi['provisions'] if p['num']]
    print(f'{len(notes)} margin notes, {len(secs)} sections')
    if len(notes) != len(secs):
        sys.exit('Counts differ: notes can\'t be paired with sections one to one. Nothing written.')
    with tempfile.TemporaryDirectory() as tmp:
        titles = [read(doc, n, tmp) for n in notes]
    for p, t in list(zip(secs, titles))[:12]:
        print(f'  {p["num"]:>4}  {t}')
    if '--apply' in sys.argv:
        for p, t in zip(secs, titles):
            p['title'] = t
        json.dump(docs, open(CORPUS, 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)
        print(f'applied: {len(secs)} headings to {slug}')


if __name__ == '__main__':
    main()
