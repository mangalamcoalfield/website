"""Split the library's Acts, Codes, Rules, Regulations and guidelines into numbered
provisions for the regulations search, and write src/data/statutes-corpus.json.

    python tools/build_statute_corpus.py <work_dir>    (after tools/library_pages.py --regulations)

Each document becomes one full-text page (/regulations/<slug>/text) with one
anchored section per provision ("Regulation 78 — Construction and installation of
winding equipment"), so a search lands on the provision, not just the document.
"""
import json, os, re, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from build_circular_corpus import clean, YEAR, slugify   # same cleaning as the circulars

OUT = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
CATEGORY = {
    'cmr_2017': 'Coal Mines Regulations 2017', 'mines_act': 'Mines Act, Rules & Regulations',
    'labour_code': 'Labour Codes & Rules', 'mmdr': 'MMDR Act & Rules', 'env_forest': 'Environment & Forest',
    'moc': 'Ministry of Coal', 'cea': 'Electricity (CEA)', 'draft': 'Drafts & consultations',
}
DEVANAGARI = re.compile(r'[ऀ-ॿ]')
FOOTNOTE = re.compile(r'^(?:Subs(?:tituted)?|Omitted|Ins(?:erted)?|Renumbered|Added|Amended|See|Vide|Re-?numbered)\b|\bby\s+(?:G\.?S\.?R|S\.?O|Notification|Act)\b', re.I)
DUPLICATES = {'cmr-2017-notification': 'coal-mines-regulations-2017'}
HEAD = re.compile(r'^(\d{1,3})([A-Z]{0,2})\.\s+(.{3,})$')

# Only instruments that are numbered throughout are split by provision; FAQs, forms,
# standards, guidelines and short notifications are indexed by page instead.
STATUTE = re.compile(r'\b(?:Act|Code|Rules?|Regulations?|Bill)\b')
NOT_STATUTE = re.compile(r'FAQ|Booklet|Handbook|Bye-?laws|Standard|\bForm\b|Amendment|Consolidated|Notification under|Appointment|Delegation|Commencement|Withdrawal|Index|Corrigendum', re.I)

def good_title(t):
    return (len(re.findall(r'[A-Za-z]', t)) >= 4 and not t.startswith('(') and not DEVANAGARI.search(t)
            and not re.search(r'GAZETTE|CHAPTER|EXTRAORDINARY', t) and len(t) <= 130)

def heading(rest):
    """The provision's heading: the words before its dash ("Shaft fittings.— (1)",
    "Powers of Inspectors – ...", "Definitions : - "), else ''."""
    r = re.sub(r'^\((?:1|a|i)\)\s*', '', rest)
    m = re.match(r'(.{3,120}?)(?:\.\s*[-—–:]+|\s+[—–]+|\s*:\s*-|\s+-\s+|\.\s*\((?:1|a|i)\))', r)
    t = m.group(1).strip(' .:-_') if m else ''
    return t if good_title(t) and not re.match(r'(?:The|This|In|Every|No|Any|Where|If|Subject)\b', t) else ''

def reflow(text):
    """PDF text breaks at the end of every printed line; rejoin lines into
    paragraphs, starting a new one at a clause marker or after a full stop."""
    out = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        starts = re.match(r'(?:\(?[a-z0-9]{1,4}\)|\(?[ivxl]{1,6}\)|\d{1,3}[A-Z]{0,2}\.\s|[A-Z][A-Z ,&\-]{6,}$|Provided|Explanation|Note|Illustration)', line)
        if out and not starts and not re.search(r'[.:;—–]$', out[-1]):
            out[-1] += ' ' + line
        else:
            out.append(line)
    return '\n'.join(out)

def english(text):
    """Bilingual gazettes carry a Hindi half; index the English text only."""
    keep = []
    for line in text.split('\n'):
        if not line.strip():
            continue
        dev = len(DEVANAGARI.findall(line))
        if dev and dev > len(line) * 0.2:
            continue
        keep.append(line)
    return '\n'.join(keep)

def noun(title):
    t = title.lower()
    if 'regulations' in t: return 'Regulation'
    if 'rules' in t: return 'Rule'
    if re.search(r'\b(act|code)\b', t): return 'Section'
    return 'Para'

def provisions(body):
    """Numbered provisions in order. The provisions are the longest run of headings
    whose numbers keep rising (with small gaps for omitted ones), so footnotes like
    "2. Omitted by GSR 316" and numbered lists inside a provision don't split it."""
    lines = body.split('\n')
    # Some Acts print the number alone on its line ("2." / "Definitions : - ...").
    for i in range(len(lines) - 1):
        if re.fullmatch(r'\s*\d{1,3}[A-Z]{0,2}\.\s*', lines[i]) and lines[i + 1].strip():
            lines[i] = lines[i].strip() + ' ' + lines[i + 1].strip()
            lines[i + 1] = ''
    cands = []
    for i, line in enumerate(lines):
        m = HEAD.match(line.strip())
        if not m:
            continue
        num, suf, rest = int(m.group(1)), m.group(2), m.group(3)
        if not re.match(r'[A-Z(]', rest) or FOOTNOTE.search(rest[:60]):
            continue
        cands.append((i, num, suf, rest))
    # Heaviest rising chain (O(n^2) is fine: a few hundred candidates per document).
    # A candidate with a proper heading ("Shaft fittings.—") weighs double, so a
    # numbered list in the preamble ("3. Mines Rules, 1955;") can't outvote the rules.
    w = [2 if heading(c[3]) else 1 for c in cands]
    best, prev = w[:], [-1] * len(cands)
    for j, (_, nj, sj, _) in enumerate(cands):
        for k in range(j):
            nk, sk = cands[k][1], cands[k][2]
            if (nk < nj <= nk + 8 or (nj == nk and sj > sk)) and best[k] + w[j] > best[j]:
                best[j], prev[j] = best[k] + w[j], k
    acc = []
    if cands:
        j = max(range(len(cands)), key=lambda x: best[x])
        while j >= 0:
            acc.append(cands[j]); j = prev[j]
        acc.reverse()
    if len(acc) < 5:
        return []
    out = []
    pre = '\n'.join(lines[:acc[0][0]]).strip()
    if len(pre) > len(body) * 0.4:
        return []                                         # the chain is a schedule's list, not the rules
    if len(pre) > 200:
        out.append(dict(num='', label='Preamble', title='Preamble and notification', text=pre))
    for k, (i, num, suf, rest) in enumerate(acc):
        end = acc[k + 1][0] if k + 1 < len(acc) else len(lines)
        text = '\n'.join(lines[i:end]).strip()
        title = heading(rest)                             # '' when the margin heading was lost
        out.append(dict(num=f'{num}{suf}', label='', title=title, text=text))
    # Long tail after the last provision = schedules and forms.
    tail = out[-1]
    m = re.search(r'\n(?:THE\s+)?(?:(?:FIRST|SECOND|THIRD|FOURTH|FIFTH)\s+)?SCHEDULE\b|\nFORM\s*[-–]?\s*[IVX\d]', tail['text'])
    if m and len(tail['text']) > 8000:
        out.append(dict(num='', label='Schedules', title='Schedules and forms', text=tail['text'][m.start():].strip()))
        tail['text'] = tail['text'][:m.start()].strip()
    return out

def by_pages(pages, size=3):
    out = []
    for k in range(0, len(pages), size):
        grp = pages[k:k + size]
        text = clean(english('\n'.join(p['text'] for p in grp)))
        if len(text) < 40:
            continue
        a, b = grp[0]['page'], grp[-1]['page']
        out.append(dict(num='', label=f'Page {a}' if a == b else f'Pages {a}–{b}',
                        title=f'Page {a}' if a == b else f'Pages {a}–{b}', text=text))
    return out

def main(work):
    docs = json.load(open(os.path.join(work, 'pages_regulations.json'), encoding='utf-8'))
    seed = {r['slug']: r for r in json.load(open(os.path.join(ROOT, 'src', 'data', 'regulations-full-seed.json'), encoding='utf-8'))}
    urls = {}
    sql = os.path.join(ROOT, 'supabase', 'regulations_download_urls.sql')
    if os.path.exists(sql):
        for m in re.finditer(r"download_url='([^']+)'[^;]*where slug='([^']+)'", open(sql, encoding='utf-8').read()):
            urls[m.group(2)] = m.group(1)
    built = []
    for slug, pages in docs.items():
        r = seed.get(slug)
        if not r or not pages:
            continue
        # Drafts and forwarded letters print officers' e-mail addresses (comment
        # addresses, distribution lists); the search pages don't need to republish them.
        for p in pages:
            p['text'] = re.sub(r'[\w.+-]+@[\w-]+(?:\.[\w-]+)+', '', p['text'])
        raw = '\n'.join(p['text'] for p in pages)
        dev = len(DEVANAGARI.findall(raw))
        body = clean(english(raw))
        if len(body) < 80:
            continue
        provs = provisions(body) if STATUTE.search(r['title']) and not NOT_STATUTE.search(r['title']) else []
        if sum(1 for p in provs if p['num']) < 15:
            provs = []
        n = noun(r['title'])
        for p in provs:
            if p['num']:
                p['label'] = f'{n} {p["num"]}'
        if not provs:
            provs = by_pages(pages)
        for p in provs:
            p['id'] = 'p-' + (p['num'].lower() if p['num'] else slugify(p['label'], 30))
            p['text'] = reflow(p['text'])
        seen = Counter()
        for p in provs:                                   # unique anchors
            seen[p['id']] += 1
            if seen[p['id']] > 1:
                p['id'] += f'-{seen[p["id"]]}'
        date = r.get('issued_date') or ''
        ys = YEAR.findall(date) or YEAR.findall(r['title'])
        built.append(dict(slug=slug, title=r['title'], category=r['category'], category_label=CATEGORY.get(r['category'], r['category']),
                          status=r.get('status') or '', doc_number=r.get('doc_number') or '', date=date,
                          year=int(ys[0]) if ys else None, pdf=urls.get(slug) or r.get('source_url') or '',
                          ocr=any(p.get('ocr') for p in pages), pages=len(pages), devanagari=dev,
                          numbered=any(p['num'] for p in provs), provisions=provs))
    # The same instrument is sometimes in the library twice: CMR 2017 as the
    # bilingual gazette and as an English-only copy. Index it once, as the copy
    # whose provisions read cleanly. (Drafts, amendments and state rules look alike
    # but are different instruments, so this is an explicit list, not a guess.)
    drop = set(DUPLICATES)
    for d in built:
        d['also'] = [k for k, v in DUPLICATES.items() if v == d['slug']]
    final = [d for d in built if d['slug'] not in drop]
    for d in final:
        d.pop('devanagari', None)
    json.dump(final, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'documents: {len(final)} (duplicates folded: {sorted(drop)})')
    print(f'with numbered provisions: {sum(d["numbered"] for d in final)} | provisions total: {sum(len(d["provisions"]) for d in final)}')
    print('file MB:', round(os.path.getsize(OUT) / 1e6, 2))

if __name__ == '__main__':
    main(sys.argv[1])
