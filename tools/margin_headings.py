"""Recover the section headings that Gazette Acts print in the margin.

The four Labour Codes (and other Acts as published in the Gazette) give each
section's heading as a marginal note beside it ("Definitions.", "Appeal.",
"Notice by employer of commencement and cessation of operations."). Plain text
extraction loses where those notes sit, so the statute corpus has the sections
untitled and the notes scattered as stray lines inside neighbouring sections.
This reads the page layout instead:

  * the body column is where the section openings ("16. (1) The Central ...") are;
  * a marginal note is a text block outside the body column, narrower than it;
  * a note ends at its full stop (not at "etc."); one starting in lower case is a
    body-text word that sticks out, not a note;
  * notes go to sections in page order, one each: the last section opening level
    with or above the note, or the next one when a stacked note was pushed down;
  * a line-break hyphen inside a note is kept where the Act's own text uses the
    hyphenated word ("Inspector-cum-Facilitator"), dropped where it uses it whole.

    python tools/margin_headings.py <pdf> <statute-slug> [<pdf> <slug> ...]   # report
    python tools/margin_headings.py ... --apply                               # write

Report: for each slug, how many sections got a heading, which didn't, and the
first 20 pairs to eyeball. --apply sets those headings as the provisions' titles
in src/data/statutes-corpus.json and removes the same lines where they were left
inside section texts. Numbers, anchors and text otherwise don't change. Needs pymupdf.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
SECTION = re.compile(r'^\s*(\d{1,3}[A-Z]{0,2})\.\s')
DEVANAGARI = re.compile(r'[ऀ-ॿ]')
# Act citations printed in the same margin ("45 of 1950."): never part of a heading.
CITATION = re.compile(r'^\d{1,3}\s+of\s+\d{4}\.?$')


def lines_of(page):
    """Text lines with their boxes: (x0, y0, x1, y1, text)."""
    out = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            t = ''.join(s['text'] for s in l['spans']).strip()
            if t:
                out.append((*l['bbox'], t))
    return out


def dehyphen(a, b, vocab):
    """Join a note's line ending in '-' to the next: keep the hyphen where the Act's own
    text spells the word with one ("Inspector-cum-Facilitator", "office-bearers"), drop
    it where the Act spells it whole, and keep it when the text has neither."""
    head, tail = a[:-1].split()[-1] if a[:-1].split() else '', b.split()[0] if b.split() else ''
    hy, whole = f'{head}-{tail}'.lower(), f'{head}{tail}'.lower()
    if whole in vocab and hy not in vocab:
        return a[:-1] + b
    return a + b


def notes_for(pdf, vocab=''):
    import pymupdf
    doc = pymupdf.open(pdf)
    found = {}
    for page in doc:
        ls = [l for l in lines_of(page) if not DEVANAGARI.search(l[4])]
        if not ls:
            continue
        starts = sorted((l for l in ls if SECTION.match(l[4])), key=lambda l: l[1])
        if not starts:
            continue
        # The body column: the x-range of the section openings (they all begin at its edge).
        left = min(l[0] for l in starts)
        width = page.rect.width
        # Its right edge: the typical right end of full body lines (justified text ends level),
        # so one over-long line or a word sticking out doesn't swallow the margin.
        rights = sorted(l[2] for l in ls if l[0] >= left - 2 and l[2] - l[0] > width * 0.35)
        body_right = rights[len(rights) // 2]
        # Marginal lines: wholly left of the body's left edge, or right of its right edge.
        margin = [l for l in ls if l[2] <= left - 3 or l[0] >= body_right + 3]
        # Join consecutive margin lines into notes (a note wraps over a few short lines).
        # A note ends at its full stop ("Appeal."), except "etc.", so two notes stacked
        # beside sections that sit close together stay two notes.
        margin.sort(key=lambda l: (round(l[0] / 20), l[1]))
        notes, cur = [], None
        for l in margin:
            ended = cur and cur[4].rstrip().endswith('.') and not cur[4].rstrip().endswith('etc.')
            if cur and not ended and not CITATION.match(l[4]) and not CITATION.match(cur[4]) \
                    and abs(l[0] - cur[0]) < 15 and l[1] - cur[3] < (l[3] - l[1]) * 0.9:
                text = dehyphen(cur[4], l[4], vocab) if cur[4].endswith('-') else cur[4] + ' ' + l[4]
                cur = (cur[0], cur[1], max(cur[2], l[2]), l[3], text)
            else:
                if cur:
                    notes.append(cur)
                cur = l
        if cur:
            notes.append(cur)
        kept = []
        for n in notes:
            text = re.sub(r'\s+', ' ', n[4]).strip()
            if len(re.findall(r'[A-Za-z]', text)) < 4 or CITATION.match(text) or re.fullmatch(r'[\d\sof.]+', text):
                continue                                                # "45 of 1950." citations, page furniture
            if not re.match(r'[A-Z(]', text):
                continue                                                # a body-text word that sticks out ("paid", "time")
            kept.append((n[1], text))
        # Notes go to sections in page order, one each: a note belongs to the last section
        # whose opening is level with or above it; one pushed below that section's opening
        # by the note before it (stacked notes) goes to the next section.
        nxt = 0
        for y, text in sorted(kept):
            k = max((i for i in range(nxt, len(starts)) if starts[i][1] <= y + 4), default=None)
            if k is None:
                if nxt < len(starts) and starts[nxt][1] - y < 60:
                    k = nxt
                else:
                    continue
            num = SECTION.match(starts[k][4]).group(1)
            if num not in found:
                found[num] = text.rstrip(' .') if not text.endswith('etc.') else text
            nxt = k + 1
    return found


def main():
    args = [a for a in sys.argv[1:] if a != '--apply']
    apply = '--apply' in sys.argv
    if len(args) < 2 or len(args) % 2:
        sys.exit(__doc__)
    docs = json.load(open(CORPUS, encoding='utf-8'))
    by_slug = {d['slug']: d for d in docs}
    changed = 0
    for pdf, slug in zip(args[::2], args[1::2]):
        d = by_slug[slug]
        vocab = ' '.join(p['text'] for p in d['provisions']).lower()
        notes = notes_for(pdf, vocab)
        nums = [p['num'] for p in d['provisions'] if p['num']]
        got = [n for n in nums if n in notes]
        print(f'{slug}: {len(got)} of {len(nums)} sections have a marginal heading; missing: {[n for n in nums if n not in notes][:30]}')
        for n in got[:20]:
            print(f'   {n:>5}  {notes[n]}')
        if not apply:
            continue
        stray = {notes[n] for n in got} | {notes[n] + '.' for n in got}
        for p in d['provisions']:
            if p['num'] in notes and not p['title']:
                p['title'] = notes[p['num']]
                changed += 1
            # Drop lines that are exactly a marginal heading left inside the text.
            p['text'] = '\n'.join(l for l in p['text'].split('\n') if l.strip() not in stray or l.strip() == p['text'].split('\n')[0].strip())
    if apply:
        json.dump(docs, open(CORPUS, 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)
        print(f'applied: {changed} headings')


if __name__ == '__main__':
    main()
