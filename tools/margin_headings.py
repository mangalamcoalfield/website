"""Recover the section headings that Gazette Acts print in the margin.

The four Labour Codes (and other Acts as published in the Gazette) give each
section's heading as a marginal note beside it ("Definitions.", "Appeal.",
"Notice by employer of commencement and cessation of operations."). Plain text
extraction loses where those notes sit, so the statute corpus has the sections
untitled and the notes scattered as stray lines inside neighbouring sections.
This reads the page layout instead:

  * the body column is where the section openings ("16. (1) The Central ...") are;
  * a marginal note is a text block outside the body column, narrower than it;
  * each note belongs to the section whose opening is nearest above-or-level
    with it on the same page (a note never starts above its section's first line).

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


def notes_for(pdf):
    import pymupdf
    doc = pymupdf.open(pdf)
    found = {}
    for page in doc:
        ls = [l for l in lines_of(page) if not DEVANAGARI.search(l[4])]
        if not ls:
            continue
        starts = [l for l in ls if SECTION.match(l[4])]
        if not starts:
            continue
        # The body column: the x-range of the section openings (they all begin at its edge).
        left = min(l[0] for l in starts)
        width = page.rect.width
        body_right = max(l[2] for l in ls if l[0] >= left - 2 and l[2] - l[0] > width * 0.35)
        # Marginal lines: wholly left of the body's left edge, or right of its right edge.
        margin = [l for l in ls if l[2] <= left - 3 or l[0] >= body_right + 3]
        # Join consecutive margin lines into notes (a note wraps over a few short lines).
        margin.sort(key=lambda l: (round(l[0] / 20), l[1]))
        notes, cur = [], None
        for l in margin:
            if cur and not CITATION.match(l[4]) and not CITATION.match(cur[4]) and abs(l[0] - cur[0]) < 15 and l[1] - cur[3] < (l[3] - l[1]) * 0.9:
                cur = (cur[0], cur[1], max(cur[2], l[2]), l[3], cur[4] + ' ' + l[4])
            else:
                if cur:
                    notes.append(cur)
                cur = l
        if cur:
            notes.append(cur)
        for n in notes:
            text = re.sub(r'\s+', ' ', n[4]).strip()
            text = re.sub(r'-\s+(?=[a-z])', '', text)                  # words hyphenated across lines
            if len(re.findall(r'[A-Za-z]', text)) < 4 or CITATION.match(text) or re.fullmatch(r'[\d\sof.]+', text):
                continue                                                # "45 of 1950." citations, page furniture
            # The section whose opening line is level with or just above the note's top.
            above = [s for s in starts if s[1] <= n[1] + 4]
            if not above:
                continue
            sec = max(above, key=lambda s: s[1])
            num = SECTION.match(sec[4]).group(1)
            if num not in found:                                        # first note beside a section is its heading
                found[num] = text.rstrip(' .') if not text.endswith('etc.') else text
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
        notes = notes_for(pdf)
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
