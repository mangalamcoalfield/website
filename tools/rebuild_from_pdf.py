"""Rebuild one library document's full text, section by section, from a newer PDF
(an official consolidated compilation, e.g. IBM's "as amended up to ..." editions).

    python tools/rebuild_from_pdf.py <pdf> <slug> [--skip N] [--cut "THE FIRST SCHEDULE"]
                                     [--note "..."] [--pdf-url URL] [--apply]

  --skip N   leading pages to drop (cover, disclaimer, contents)
  --cut T    where the numbered provisions end; what follows is kept as one
             "Schedules and Forms" part
  --note     shown on the full-text page above the text ("as amended up to ...")

Without --apply it reports the provisions found, the ones without a heading and
the numbering gaps. With --apply it replaces the slug's provisions in
src/data/statutes-corpus.json (or adds the document, taking its title, category and
status from the library seed). Uses the same splitter as build_statute_corpus.py,
plus normalising the opening lines consolidated editions print with amendment
markers and hyphens ("1[2[5. Restrictions ...", "5[9-B. District Mineral
Foundation.", "3[10. B. Grant of ...").
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build_statute_corpus as B          # noqa: E402
from pii import scrub                     # noqa: E402

CORPUS = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
SEED = os.path.join(ROOT, 'src', 'data', 'regulations-full-seed.json')
OPENING = re.compile(r'^\s*(?:\d{1,3}\s?\[)*(\d{1,3})(?:(?:-|\.\s?)?([A-Z]{1,2}))?\.\s+(.*)$')


def headline(line):
    m = OPENING.match(line)
    if not m or not re.match(r'(?:\d{1,3}\s?\[)*\[?[A-Z]', m.group(3)):
        return line
    rest = re.sub(r'\d{1,3}\s?\[', '', m.group(3)).replace('[', '').replace(']', '')
    return f"{m.group(1)}{m.group(2) or ''}. {rest}"


def title_of(text):
    first = re.sub(r'^\S+\s*', '', text.split('\n')[0]).strip()
    m = re.match(r'(.{3,160}?)\.(?:\s*[-—–]+.*)?$', first) or re.match(r'(.{3,160}?)\.\s*[-—–]', first) \
        or re.match(r'(.{3,160}?)\s*[-—–]{1,2}\s*\(', first)
    t = m.group(1).strip(' .') if m else ''
    return '' if re.match(r'(?:The|In|Any|No|Where|If|Every|Subject)\b', t) else t


def build(pdf, title, skip=0, cut=None):
    import pymupdf
    pages = list(pymupdf.open(pdf))[skip:]
    raw = '\n'.join(scrub(p.get_text()) for p in pages)
    raw = re.sub(r'(?m)^\s*\d{1,3}\s*$', '', raw)                       # page numbers
    raw = '\n'.join(headline(l) for l in raw.split('\n'))
    tail = ''
    if cut and cut in raw:
        i = raw.find(cut)
        raw, tail = raw[:i], raw[i:]
    provs = B.split(B.clean(B.english(raw), keep_numbered=True), title)
    unit = B.noun(title)
    for p in provs:
        if p['num']:
            p['label'] = f'{unit} {p["num"]}'
            p['id'] = 'p-' + p['num'].lower()
            p['title'] = p['title'] or title_of(p['text'])
    if tail.strip():
        provs.append(dict(num='', label='Schedules and Forms', title='Schedules and Forms',
                          text=B.reflow(B.clean(B.english(tail), keep_numbered=True)), id='p-schedules'))
    return provs, len(pages) + skip


def main():
    a = sys.argv[1:]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    pos = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or not a[i - 1].startswith('--') or a[i - 1] == '--apply')]
    if len(pos) != 2:
        sys.exit(__doc__)
    pdf, slug = pos
    seed = {r['slug']: r for r in json.load(open(SEED, encoding='utf-8-sig'))}
    docs = json.load(open(CORPUS, encoding='utf-8'))
    old = next((d for d in docs if d['slug'] == slug), None)
    r = seed.get(slug)
    title = (old or {}).get('title') or (r or {}).get('title')
    if not title:
        sys.exit(f'{slug}: not in the library seed')
    provs, npages = build(pdf, title, int(opt('--skip', 0)), opt('--cut'))
    n = [p for p in provs if p['num']]
    print(f'{slug}: {len(n)} provisions; without heading: {[p["num"] for p in n if not p["title"]]}; gaps: {B.gaps(provs)}')
    if old:
        print(f'  (was {sum(1 for p in old["provisions"] if p["num"])} provisions)')
    for p in n[:8]:
        print(f'  {p["label"]:>14}  {p["title"][:90]}')
    if '--apply' not in a:
        return
    doc = old or dict(slug=slug, title=r['title'], category=r['category'],
                      category_label=B.CATEGORY.get(r['category'], r['category']), status=r.get('status') or '',
                      doc_number=r.get('doc_number') or '', date=r.get('issued_date') or '',
                      year=int(B.YEAR.findall(r.get('issued_date') or r['title'])[0]) if B.YEAR.findall(r.get('issued_date') or r['title']) else None,
                      also=[])
    doc.update(provisions=provs, ocr=False, pages=npages, numbered=True, pdf=opt('--pdf-url') or doc.get('pdf') or (r or {}).get('source_url', ''))
    if opt('--note'):
        doc['text_note'] = opt('--note')
    if not old:
        docs.append(doc)
    json.dump(docs, open(CORPUS, 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)
    print('written')


if __name__ == '__main__':
    main()
