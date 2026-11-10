"""Add the Hindi text of an Act or Code to the statute corpus, section by section,
alongside its English text.

    python tools/hindi_statute.py <pdf-or-txt> <english-slug> [--pdf-url URL] [--apply]

Without --apply it reports: how much of the extracted text is Devanagari, whether
the PDF uses a legacy font (Kruti Dev and the like extract as Latin gibberish such
as "Hkkjr dk jkti=k"), how many of the English text's sections were found, and the
first headings to eyeball. With --apply it writes a corpus entry "<english-slug>-hindi"
to src/data/statutes-corpus.json, with lang "hi" and the same section anchors as the
English text (p-17 is section 17 in both), so the two pages can link to each other.

A PDF with a legacy font has no usable text layer: OCR it to a UTF-8 .txt first
(Windows OCR with the Hindi language pack, or `tesseract file.png out -l hin`),
one page per form feed or as one file, and pass the .txt instead.

Sections are found as lines opening with a section number of the English text
("17.", "१७.", "72क."), in order: a number is accepted only after the previous
one, so numbered list items inside a section aren't taken for sections. The
heading is the text up to the first dash or colon after the number, as the Act
prints it ("17. प्रबंधक—(1) ..."). Section text is kept as extracted; only page
headers and footers of the Gazette are dropped.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
DEV = re.compile(r'[ऀ-ॿ]')
DIGITS = str.maketrans('०१२३४५६७८९', '0123456789')
SUFFIX = {'क': 'A', 'ख': 'B', 'ग': 'C', 'घ': 'D', 'ङ': 'E', 'च': 'F'}
# Legacy-font Hindi read as Latin: common Kruti Dev renderings of frequent words.
LEGACY = re.compile(r'Hkkjr|jkti=k|vf/kfu;e|ds\s|vkSj|fd;k|tkus|dh\s+/kkjk')
OPEN = re.compile(r'^\s*(?:\d{0,2}\[)?([0-9०-९]{1,3})([कखगघङच]|[A-Z])?\s*\.\s*(.*)$')
FURNITURE = re.compile(r'भारत\s+का\s+राजपत्र|THE\s+GAZETTE\s+OF\s+INDIA|^\s*\[?\s*भाग\s+II|^\s*\d{1,4}\s*$|^\s*[०-९]{1,4}\s*$')


def read(path):
    if path.lower().endswith('.pdf'):
        import pymupdf
        return '\n'.join(page.get_text() for page in pymupdf.open(path))
    return open(path, encoding='utf-8').read()


def quality(text):
    letters = re.findall(r'[A-Za-zऀ-ॿ]', text)
    dev = sum(1 for c in letters if DEV.match(c))
    return dev / max(len(letters), 1), len(LEGACY.findall(text))


def num_of(m):
    return m.group(1).translate(DIGITS) + (SUFFIX.get(m.group(2), m.group(2)) if m.group(2) else '')


def heading(rest):
    """"प्रबंधक—(1) ..." or "प्रबन्धक--(1) ..." -> the heading; nothing when the line opens straight into text."""
    h = re.split(r'\s*(?:--|[—–]|:-|:—|\.—|-(?=\()|-\s|:)\s*', rest, maxsplit=1)[0]
    h = re.sub(r"[\d!'\"“”‘’]*\[|\]", '', h).replace('\u200c', '').replace('\u200d', '').strip(' .,-।')
    return h if 2 <= len(h) <= 160 and DEV.search(h) and not re.match(r'\(', h) else ''


def split(text, nums):
    """Cut the text at the openings of the English text's sections, in their order."""
    order = {n: i for i, n in enumerate(nums)}
    lines = [l for l in text.split('\n') if l.strip() and not FURNITURE.search(l)]
    cuts, last = [], -1
    for i, l in enumerate(lines):
        m = OPEN.match(l)
        if not m:
            continue
        n = num_of(m)
        if n in order and order[n] > last and order[n] - last <= 6:     # no long jumps: a stray "45." in a list
            cuts.append((i, n, heading(m.group(3))))
            last = order[n]
    out = []
    if cuts and cuts[0][0] > 0:
        out.append(('', '\n'.join(lines[:cuts[0][0]])))
    for k, (i, n, h) in enumerate(cuts):
        end = cuts[k + 1][0] if k + 1 < len(cuts) else len(lines)
        out.append((n, '\n'.join(lines[i:end]), h))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        sys.exit(__doc__)
    src, slug = args
    url = sys.argv[sys.argv.index('--pdf-url') + 1] if '--pdf-url' in sys.argv else ''
    docs = json.load(open(CORPUS, encoding='utf-8'))
    en = next(d for d in docs if d['slug'] == slug)
    nums = [p['num'] for p in en['provisions'] if p['num']]
    text = read(src)
    share, legacy = quality(text)
    print(f'{src}: {len(text):,} characters, {share:.0%} of letters Devanagari, {legacy} legacy-font words')
    if share < 0.5 or legacy > 20:
        sys.exit('This text layer is not Unicode Hindi (legacy font or scan). OCR it to a .txt and pass that instead.')
    parts = split(text, nums)
    found = [p[0] for p in parts if p[0]]
    missing = [n for n in nums if n not in found]
    print(f'{len(found)} of {len(nums)} sections found; missing: {missing[:40]}')
    for p in [p for p in parts if p[0]][:15]:
        print(f'  {p[0]:>4}  {p[2] or "(no heading)"}  |  {p[1][:70]!r}')
    if '--apply' not in sys.argv:
        return
    # Repealed sections the Hindi text prints only as "[निरसित]" are still found; an
    # English section the Hindi text lacks is simply not there (the page says so).
    provisions = []
    for p in parts:
        if not p[0]:
            provisions.append(dict(num='', label='प्रस्तावना', title='', text=p[1], id='p-preamble'))
        else:
            provisions.append(dict(num=p[0], label=f'धारा {p[0]}', title=p[2], text=p[1], id=f'p-{p[0]}'))
    hi = dict(en, slug=f'{slug}-hindi', title=f'{en["title"]} — हिन्दी पाठ', pdf=url or en['pdf'], ocr=src.lower().endswith('.txt'),
              provisions=provisions, also=[], lang='hi', translation_of=slug)
    docs = [d for d in docs if d['slug'] != hi['slug']]
    docs.insert(docs.index(en) + 1, hi)
    json.dump(docs, open(CORPUS, 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)
    print(f'written: {hi["slug"]} ({len(provisions)} parts)')


if __name__ == '__main__':
    main()
