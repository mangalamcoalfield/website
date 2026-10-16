"""Stage 2 of the circular corpus: split the DGMS compilations into individual
circulars and write src/data/circulars-corpus.json for the site to render and index.

    python tools/build_circular_corpus.py <work_dir>      (after tools/circular_pages.py)

How each part is split:
  * Upto-June-2017, Parts I and III–X (pp 3–492, 541–674): a digest arranged by
    regulation; every instruction is a block that ends in its reference, e.g.
    "(Cir. 65/1963)" or "[Cir. 24/1972]". One block = one entry.
  * Part II (pp 493–540): recommendations of the National Safety Conferences;
    one entry per conference.
  * Part XI (pp 676–1338): full circulars and notifications, 1995–June 2017;
    split at each circular header ("... Circular No. ... Sub:") or gazette
    notification ("GSR / S.O. ...").
  * 2018–2024 compilation: split by its own table of contents.
"""
import json, os, re, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data', 'circulars-corpus.json')
PDF = {'upto2017': 'DGMS_Circulars_UptoJune2017_CIRCULARSNew_19092025.pdf',
       '2018_2024': 'DGMS_Circulars_2018-2024_06122024.pdf'}     # names as hosted on docs.mangalamcoal.com/regs/
# Library entries carry their own absolute PDF URL instead.

# Chapters of the Upto-June-2017 digest (from its contents page).
CHAPTERS = [
    (3, 19, 'Returns, notices and records'), (20, 45, 'Examinations and certificates of competency'),
    (46, 60, 'Inspectors and mine officials'), (61, 76, 'Duties of workmen, competent persons and officials'),
    (77, 92, 'Plans and sections'), (93, 93, 'Means of access and egress'),
    (94, 155, 'Winding in shafts'), (156, 198, 'Haulage'), (199, 295, 'Mine workings'),
    (296, 334, 'Fire, dust, gas and water'), (335, 358, 'Ventilation'), (359, 371, 'Lighting and safety lamps'),
    (372, 427, 'Explosives and shot firing'), (428, 450, 'Machinery, plant and equipment'),
    (451, 472, 'Miscellaneous regulations'), (473, 492, 'General'),
    (493, 540, 'National Safety Conference recommendations'), (541, 569, 'Mines Act, 1952'),
    (570, 607, 'Mines Rules, 1955'), (608, 609, 'Mines Rescue Rules, 1985'),
    (610, 637, 'Mines Vocational Training Rules, 1966'), (638, 638, 'Mines Creche Rules, 1966'),
    (639, 639, 'Mines Maternity Benefit Act & Rules'), (640, 658, 'Electricity (CEA) regulations'),
    (659, 675, 'Oil Mines Regulations, 1984'), (676, 1340, 'Circulars and notifications, 1995–June 2017'),
]
def chapter(p):
    # The contents page uses printed page numbers, which run one behind the PDF's
    # (printed 1199 sits on PDF page 1200).
    printed = p - 1
    for a, b, name in CHAPTERS:
        if a <= printed <= b:
            return name
    return ''

FURNITURE = re.compile(r'^(?:ISN|DGMS|\d{1,4}|A\s*-\s*\d{1,3}|Page \d+ of \d+|DGMS Circulars? \d{4}|(?:DGMS\s+)+\d{1,4}(?:\s+ISN)?)$')
PAGE_PREFIX = re.compile(r'^(?:DGMS\s+)+\d{1,4}\s+')       # "DGMS 153 CMR85/MMR93" -> "CMR85/MMR93"
def mojibake(line):
    odd = sum(1 for ch in line if ch in 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ¸¾´¤¿†™¬»«±')
    return odd >= 3 and odd > len(line) * 0.15

# Circulars and drafts print officers' e-mail addresses (distribution lists,
# comment addresses, some personal); the search pages don't republish them.
EMAIL = re.compile(r'[\w.+-]+@[\w-]+(?:\.[\w-]+)+')

def clean(text):
    out = []
    text = EMAIL.sub('', text)
    for raw in text.split('\n'):
        line = PAGE_PREFIX.sub('', re.sub(r'\s+', ' ', raw).strip())
        if not line or FURNITURE.match(line) or mojibake(line):
            continue
        out.append(line)
    # Re-join wrapped lines into paragraphs: a line ending without terminal punctuation
    # usually continues on the next one.
    paras, cur = [], ''
    for line in out:
        if cur and not re.search(r'[.:;?!)\]]$', cur) and not re.match(r'^(?:\(?[ivx]+\)|\(?[a-z]\)|\d+[.)]|•|[-–])\s', line):
            cur += ' ' + line
        else:
            if cur:
                paras.append(cur)
            cur = line
    if cur:
        paras.append(cur)
    return '\n'.join(paras)

def stream(pages, a, b):
    """Concatenate pages a..b, remembering where each page starts in the text."""
    text, starts = '', []
    for p in pages:
        if a <= p['page'] <= b:
            starts.append((len(text), p['page']))
            text += p['text'] + '\n'
    return text, starts

def page_at(starts, pos):
    pg = starts[0][1]
    for off, p in starts:
        if off <= pos:
            pg = p
        else:
            break
    return pg

def slugify(s, n=70):
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s[:n].rstrip('-') or 'circular'

YEAR = re.compile(r'(?<!\d)(19[3-9]\d|20[0-2]\d)(?!\d)')

HEADING_LINE = re.compile(r'^(?:(?:CMR|MMR|OMR)\s*[\d&/ ,A-Za-z\.\-]{0,40}|Note|Notes?:?|\d{1,4}|[\d\.\s]+|Notes?\s*[—–:\-].{0,160})$')   # a trailing "Note—See circulars under ..." belongs to the previous entry

def make_title(body, max_len=140):
    """Title = the first real line of the entry, minus regulation headings and
    numbering, cut at the em dash the digest uses before its text. Falls back to the
    first sentence with a few words in it when the opening line is a number or a form."""
    lines = [l for l in body.split('\n') if l.strip()]
    while lines and HEADING_LINE.match(lines[0].strip()):
        lines.pop(0)
    first = re.sub(r'^\(?\d{1,2}[.)]\s*', '', lines[0]) if lines else ''
    title = re.split(r'\s*[—–]\s*|\s+-\s+', first, maxsplit=1)[0].strip(' .:;')
    if len(title) > max_len:
        title = re.split(r'(?<=[a-z0-9\)])[.;:]\s', title, maxsplit=1)[0][:max_len]
    if len(re.findall(r'[A-Za-z]{3,}', title)) < 3:
        for s in re.split(r'(?<=[.;:])\s+|\n', body):
            if len(re.findall(r'[A-Za-z]{3,}', s)) >= 4:
                title = s.strip(' .:;')[:max_len]
                break
    return title

# ------------------------------------------------------------------ digest parts
# Allows one nested bracket, e.g. "(Cir. (Tech.) 2/1985)".
REF = re.compile(r'[\(\[]\s*(?:DGMS\s*)?(?:(?:Tech|Genl|Legis|Approval|Elect|S&T)\.?\s*)?Cir(?:cular)?s?\b(?:[^()\[\]]|\([^()]{0,30}\)){0,160}[\)\]]', re.I)
REG_HEAD = re.compile(r'^(?:CMR|MMR|OMR|Reg\.?|Rule|Section|Sec\.)\s*[\d&/ ,A-Za-z\.\-]{0,40}$')

def digest(pages, a, b, set_key):
    text, starts = stream(pages, a, b)
    entries, last, reg = [], 0, ''
    for m in REF.finditer(text):
        block = text[last:m.end()]
        start = last
        last = m.end()
        lines = [re.sub(r'\s+', ' ', l).strip() for l in block.split('\n')]
        for l in lines:                       # track the governing regulation heading
            if REG_HEAD.match(l) and re.search(r'\d', l):
                reg = l
        body = clean(block)
        if len(body) < 60:
            continue
        title = make_title(body)
        ref = re.sub(r'\s+', ' ', m.group(0)).strip('()[] ')
        years = [int(y) for y in YEAR.findall(ref)]
        # The entry starts where its title does, not where the previous one ended
        # (often the foot of the previous page).
        words = re.findall(r'\S+', title)[:4]
        hit = re.search(r'\s+'.join(map(re.escape, words)), block) if words else None
        p0 = page_at(starts, start + (hit.start() if hit else len(block) - len(block.lstrip())))
        p1 = page_at(starts, m.start())
        entries.append(dict(set=set_key, kind='digest', ref=ref, title=title.strip(' .:'), date='',
                            year=max(years) if years else None, section=chapter(p0), regulation=reg,
                            page=p0, page_end=p1, text=body))
    return entries

CONF_YEAR = {'First': 1958, 'Second': 1966, 'Third': 1973, 'Fourth': 1978, 'Fifth': 1980, 'Sixth': 1986,
             'Seventh': 1988, 'Eighth': 1993, 'Ninth': 2000, 'Tenth': 2007, 'Eleventh': 2013}

def conferences(pages, a, b, set_key):
    """One entry per National Safety Conference. Headings are capitalised
    ("RECOMMENDATIONS OF THE SECOND CONFERENCE") — matched case-sensitively so the
    many in-text mentions of "recommendations of the conference" don't split it.
    The First Conference has no heading (it opens the part), and the Eleventh is
    introduced by a circular line rather than a heading."""
    text, starts = stream(pages, a, b)
    marks = [(m.start(), m.group(1).title()) for m in re.finditer(r'RECOMMENDATIONS? OF (?:THE )?([A-Z]{4,}) CONFERENCE', text)]
    m11 = re.search(r'Recommendations of 11th National Conference on Safety in Mines held', text)
    if m11:
        marks.append((m11.start(), 'Eleventh'))
    marks.sort()
    if marks and marks[0][1] != 'First':
        marks.insert(0, (0, 'First'))
    out = []
    for i, (pos, name) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        body = clean(text[pos:end])
        if len(body) < 80:
            continue
        p0 = page_at(starts, pos)
        out.append(dict(set=set_key, kind='conference', ref=f'{name} National Conference on Safety in Mines',
                        title=f'Recommendations of the {name} Conference on Safety in Mines', date='',
                        year=CONF_YEAR.get(name), section=chapter(p0), regulation='',
                        page=p0, page_end=page_at(starts, end - 1), text=body))
    return out

# ------------------------------------------------------------------ full circulars
SUB = re.compile(r'\bSub(?:ject)?\s*(?:[:;]|\.?\s*[:\-–—](?!\s*(?:section|region|station|rule|regulation|clause|para|division|area|zone|contractor|committee|inspector|staff|ordinate)))', re.I)
HEAD = re.compile(r'(?:No\.?\s*)?DGMS\s*[\(/]|DGMS\s+Circular|Circular\s*(?:\([^)]{1,25}\)\s*)?No|Government of India|Directorate[- ]General of Mines Safety', re.I)
NOTIF = re.compile(r'New Delhi,?\s*(?:the\s*)?\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+,?\s+\d{4}[^\n]{0,40}\n?\s*(?:G\.?\s*S\.?\s*R\.?|S\.?\s*O\.?)\s*\d+', re.I)
CIRC_REF = re.compile(r'(?:No\.?\s*)?(?:DGMS\s*)?(?:\([^)]{1,30}\)\s*)*/?\s*Circular\b\s*(?:\([^)]{1,25}\)\s*)?(?:No\.?\s*)?[/\s]*[\w\.\-/]{1,12}(?:\s*\(Revised\))?(?:\s*of\s*\d{4})?', re.I)
DATE = re.compile(r'[Dd]ate[d]?\s*(?:the\s*)?[\s:\-–]*([0-3]?\d(?:st|nd|rd|th)?[\s\./\-]+(?:[01]?\d|[A-Z][a-z]+)[\s\./\-,]+(?:19|20)\d\d)')

def full_circulars(pages, a, b, set_key):
    text, starts = stream(pages, a, b)
    bounds = []
    for m in SUB.finditer(text):
        win_start = max(0, m.start() - 500)
        heads = [h for h in HEAD.finditer(text, win_start, m.start())]
        bounds.append(('circ', heads[0].start() if heads else max(0, text.rfind('\n', 0, max(0, m.start() - 200))), m))
    for m in NOTIF.finditer(text):
        bounds.append(('notif', m.start(), m))
    bounds.sort(key=lambda x: x[1])
    merged = []                                   # drop boundaries inside the previous header
    for bd in bounds:
        if merged and bd[1] - merged[-1][1] < 150:
            continue
        merged.append(bd)
    out = []
    for i, (kind, pos, m) in enumerate(merged):
        end = merged[i + 1][1] if i + 1 < len(merged) else len(text)
        raw = text[pos:end]
        body = clean(raw)
        if len(body) < 120:
            continue
        head = re.sub(r'\s+', ' ', text[pos:pos + 600])
        if kind == 'circ':
            subj = re.sub(r'\s+', ' ', text[m.end():m.end() + 260]).strip(' :-–—;.')
            title = re.split(r'(?<=[a-z0-9\)])\.\s|\s{2,}', subj, maxsplit=1)[0][:160]
            r = CIRC_REF.search(head[:max(40, m.start() - pos + 10)])
            ref = re.sub(r'\s+', ' ', r.group(0)).strip(' ,./') if r else ''
        else:
            first = re.sub(r'\s+', ' ', raw[:400])
            g = re.search(r'(?:G\.?\s*S\.?\s*R\.?|S\.?\s*O\.?)\s*\d+\s*(?:\([A-Z]\))?', first)
            ref = g.group(0) if g else 'Notification'
            after = first[g.end():] if g else first
            title = re.split(r'(?<=[a-z0-9\)])\.\s', after.strip(' –—-:'), maxsplit=1)[0][:160]
        if len(re.findall(r'[A-Za-z]{3,}', title)) < 3:      # e.g. OCR'd "1.0 1.1 2.0" headings
            title = make_title(body, 160)
        dm = DATE.search(head)
        date = dm.group(1).strip() if dm else ''
        ys = YEAR.findall(date) or YEAR.findall(ref) or YEAR.findall(head[:300])
        if kind == 'circ' and ref:
            # "No. DGMS (Tech)/Circular No./ 02" -> "DGMS (Tech) Circular No. 02 of 2009"
            ref = re.sub(r'^No\.?\s*', '', ref)
            ref = re.sub(r'\s*/\s*', ' ', ref)
            ref = re.sub(r'\bNo\.?\s*', 'No. ', ref).replace('No. No. ', 'No. ')
            ref = re.sub(r'\s+', ' ', ref).strip(' .,')
            if ys and not re.search(r'of\s*\d{4}', ref) and re.search(r'\d', ref):
                ref += f' of {ys[0]}'
        p0 = page_at(starts, pos)
        out.append(dict(set=set_key, kind='notification' if kind == 'notif' else 'circular', ref=ref, title=title or ref,
                        date=date, year=int(ys[0]) if ys else None, section=chapter(p0) if set_key == 'upto2017' else '',
                        regulation='', page=p0, page_end=page_at(starts, end - 1), text=body))
    return out

# ------------------------------------------------------------------ 2018–2024 by contents
def by_contents(pages, set_key):
    toc = '\n'.join(p['text'] for p in pages if 2 <= p['page'] <= 4)
    toc = re.sub(r'[ \t]+', ' ', toc)
    year_heads = [(m.start(), int(m.group(1))) for m in re.finditer(r'DGMS CIRCULARS\s*-\s*(\d{4})', toc)]
    items = []
    for m in re.finditer(r'(?m)^\s*(\d{1,3})\.\s+(Legislative|Technical|Approval|Examination|Exam|General|Genl\.?)\s+(.+?)\s+(\d{1,3})\s*$', toc):
        y = [yy for pos, yy in year_heads if pos < m.start()]
        items.append((int(m.group(1)), m.group(2), m.group(3).strip(), int(m.group(4)), y[-1] if y else None))
    if not items:          # contents rows wrapped across lines: join and retry
        flat = ' '.join(toc.split())
        for m in re.finditer(r'(\d{1,3})\.\s+(Legislative|Technical|Approval|Examination|Exam|General)\s+(.+?)\s+(\d{1,3})(?=\s+\d{1,3}\.\s+(?:Legislative|Technical|Approval|Examination|Exam|General)|\s+DGMS CIRCULARS|\s*$)', flat):
            yrs = [int(x) for x in re.findall(r'DGMS CIRCULARS\s*-\s*(\d{4})', flat[:m.start()])]
            items.append((int(m.group(1)), m.group(2), m.group(3).strip(), int(m.group(4)), yrs[-1] if yrs else None))
    # printed page -> PDF page. The printed number is the LAST line of each page;
    # take the most common difference so a stray number in the text can't skew it.
    votes = Counter()
    for p in pages:
        t = [l.strip() for l in p['text'].strip().split('\n') if l.strip()]
        if p['page'] > 4 and t and t[-1].isdigit():
            votes[p['page'] - int(t[-1])] += 1
    offset = votes.most_common(1)[0][0] if votes else 4
    items.sort(key=lambda x: x[3])
    out = []
    last_pdf = max(p['page'] for p in pages)
    for k, (n, typ, rest, printed, yr) in enumerate(items):
        p0 = printed + offset
        p1 = (items[k + 1][3] + offset - 1) if k + 1 < len(items) else last_pdf
        p1 = max(p0, p1)
        body = clean('\n'.join(p['text'] for p in pages if p0 <= p['page'] <= p1))
        ref, _, subj = rest.partition(':')
        if not subj:
            ref, subj = rest, rest
        ys = YEAR.findall(ref)
        out.append(dict(set=set_key, kind='circular', ref=ref.strip(), title=subj.strip(' .'), date='',
                        year=int(ys[-1]) if ys else yr, section=f'{typ} circulars', regulation='',
                        page=p0, page_end=p1, text=body))
    return out

# ------------------------------------------------------------------ DGMS wing ("department")
# DGMS labels each circular with the wing that issued it — "(Tech)", "(Legis)",
# "(Genl)", "(Approval)", "(Exam)" … — in the reference itself. The technical wing's
# sub-units (S&T, SOMA, MAMID, Sapicom) are reported as Technical. Older digest
# references such as "Cir. 65/1963" name no wing; those stay "Not stated" rather
# than being guessed.
WINGS = [
    ('Occupational Health', r'\bOH\b|occupational health|medical exam'),
    ('Electrical', r'\bElect(?:rical)?\b'),
    ('Examination', r'\bExam(?:ination)?s?\b|Board of Mining Exam'),
    ('Approval', r'\bApproval\b'),
    ('Legislative', r'\bLegi?s(?:lative)?\.?\b'),
    ('General', r'\bGenl\.?\b|\bGeneral\b'),
    ('Technical', r'\bTech(?:nical)?\.?\b|\bS\s*&\s*T\b|\bSOMA\b|\bMAMID\b|\bSapicom\b'),
]
def wing(e):
    if e['kind'] == 'conference':
        return 'Safety conference recommendations'
    if e['kind'] == 'notification' or re.match(r'^(?:G\.?\s*S\.?\s*R|S\.?\s*O)\b', e['ref'] or ''):
        return 'Gazette notifications'
    full = e.get('full_title') or e['title']
    if re.search(r'safety\s*alert', f"{e['ref']} {full}", re.I):
        return 'Safety alerts'
    if e['set'] == 'library':
        # DGMS publications that sit in the library but are not circulars.
        if re.search(r'Statistics of Mines|SANKET|Standard Note|Annual Report', full, re.I):
            return 'Reports & statistics'
        if re.search(r'\b(?:Rules|Regulations|Act)\b,?\s*(?:\(|19|20)', full) and not re.search(r'Circular', full, re.I):
            return 'Rules & regulations'
    if e['set'] == '2018_2024':                       # the contents page states the type
        typ = e['section'].replace(' circulars', '')
        typ = {'Exam': 'Examination', 'Genl.': 'General', 'Genl': 'General'}.get(typ, typ)
        if re.search(r'\bOH\b', e['ref']):
            return 'Occupational Health'
        return typ
    # The wing comes from the reference only — never the subject, or "OEM spares in
    # approved electrical equipment" (a Technical circular) reads as Electrical.
    for name, pat in WINGS:
        if re.search(pat, e['ref'] or '', re.I):
            return name
    return 'Not stated'

# ------------------------------------------------------------------ individual PDFs in the library
def library(work):
    """DGMS circulars and notifications held as individual PDFs in the regulations
    library (tools/library_pages.py): everything after the 2018–24 compilation and
    older ones DGMS never compiled. One entry per document, full text, linked to
    its hosted copy and its library page."""
    path = os.path.join(work, 'pages_library.json')
    if not os.path.exists(path):
        print('library: pages_library.json not found — skipping individual PDFs')
        return []
    docs = json.load(open(path, encoding='utf-8'))
    seed = {r['slug']: r for r in json.load(open(os.path.join(ROOT, 'src', 'data', 'regulations-full-seed.json'), encoding='utf-8'))}
    urls = {}
    sql = os.path.join(ROOT, 'supabase', 'regulations_download_urls.sql')   # generated from the live DB
    if os.path.exists(sql):
        for m in re.finditer(r"download_url='([^']+)'[^;]*where slug='([^']+)'", open(sql, encoding='utf-8').read()):
            urls[m.group(2)] = m.group(1)
    out = []
    for slug, pages in docs.items():
        r = seed.get(slug)
        if not r:
            continue
        # The two compilations are also listed in the library (under other file
        # names); they are already split circular by circular, so skip the whole copies.
        if re.search(r'DGMS Circulars .*(?:Compilation|Consolidated)', r['title'], re.I):
            continue
        body = clean('\n'.join(p['text'] for p in pages))
        if len(body) < 80:
            body = clean(r.get('summary') or '') or r['title']
        date = r.get('issued_date') or ''
        ys = YEAR.findall(date) or YEAR.findall(r['title'])
        # Library titles are "<number> — <subject>"; when no document number is stored,
        # the number is the part before the dash.
        ref, title = r.get('doc_number') or '', r['title']
        parts =re.split(r'\s+[—–-]\s+', title, maxsplit=1)
        if len(parts) == 2 and re.search(r'\d', parts[0]) and len(parts[0]) <= 70:
            if not ref:
                ref = parts[0].strip()
            title = parts[1].strip()
        out.append(dict(set='library', kind='notification' if r['category'] == 'dgms_notification' else 'circular',
                        ref=ref, title=title, date=date, full_title=r['title'],
                        year=int(ys[0]) if ys else None,
                        section='DGMS notifications' if r['category'] == 'dgms_notification' else 'DGMS circulars',
                        regulation='', page=1, page_end=max(1, len(pages)), text=body,
                        pdf=urls.get(slug) or r.get('source_url') or '', library_slug=slug,
                        ocr_pages=[p['page'] for p in pages if p.get('ocr')]))
    return out

def main(work):
    up = json.load(open(os.path.join(work, 'pages_upto2017.json'), encoding='utf-8'))
    new = json.load(open(os.path.join(work, 'pages_2018_2024.json'), encoding='utf-8'))
    ocr_up = {p['page'] for p in up if p['ocr']}
    ocr_new = {p['page'] for p in new if p['ocr']}
    entries = []
    entries += digest(up, 3, 492, 'upto2017')
    entries += conferences(up, 493, 540, 'upto2017')
    entries += digest(up, 541, 675, 'upto2017')
    entries += full_circulars(up, 676, 1340, 'upto2017')
    entries += by_contents(new, '2018_2024')
    lib = library(work)
    # ids, OCR flags, file links
    seen = Counter()
    for e in entries:
        ocrset = ocr_up if e['set'] == 'upto2017' else ocr_new
        e['ocr'] = any(p in ocrset for p in range(e['page'], e['page_end'] + 1))
        e['pdf'] = PDF[e['set']]
        e['library_slug'] = ''
    for e in lib:
        e['ocr'] = bool(e.pop('ocr_pages'))
    entries += lib
    for e in entries:
        e['dept'] = wing(e)
        # "DGMS (Tech) Circular No. 10" -> "... No. 10 of 2026": a circular number is
        # only unique with its year.
        if e['year'] and re.search(r'Circular', e['ref'] or '', re.I) and re.search(r'\d', e['ref']) \
                and not YEAR.search(e['ref']):
            e['ref'] = f"{e['ref'].rstrip(' .,')} of {e['year']}"
        base = slugify(f"{e['ref'] or e['title']} {e['title'] if e['ref'] else ''}")
        seen[base] += 1
        e['id'] = base if seen[base] == 1 else f'{base}-{seen[base]}'
    json.dump(entries, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    by = Counter((e['set'], e['kind']) for e in entries)
    print('entries:', len(entries), dict(by))
    print('with year:', sum(1 for e in entries if e['year']), '| OCR-derived:', sum(e['ocr'] for e in entries))
    print('by department:', dict(Counter(e['dept'] for e in entries).most_common()))
    print('text chars:', sum(len(e['text']) for e in entries), '| file MB:', round(os.path.getsize(OUT) / 1e6, 2))

if __name__ == '__main__':
    main(sys.argv[1])
