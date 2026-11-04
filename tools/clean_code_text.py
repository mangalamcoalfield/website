"""Clean the Labour Codes' full text of Gazette page furniture, once their section
headings are in place (tools/margin_headings.py).

    python tools/clean_code_text.py            # report what would change
    python tools/clean_code_text.py --apply    # write src/data/statutes-corpus.json

The Gazette prints each Code in two columns with marginal notes and running page
headers; plain extraction left, inside the section texts:
  * page headers "[PART II—" and "SEC. 1]", often joined to the next words;
  * Act citations from the margin, on lines of their own ("45 of 1860.");
  * marginal headings on lines of their own, sometimes with odd spacing
    ("Appointment of Inspector- cum- Facilitators.");
  * marginal headings dropped into the middle of a sentence at a page or column
    break ("... unless he Duties and responsibilities of owner, agent and manager
    in relation to mine. [PART II— proves that he had used due diligence ...").
A heading counts as dropped into a sentence only where it breaks one: the words
before it are left unfinished (a comma, "or", "and", "he" ...) or lower-case text
carries on after it. A heading that is also an ordinary phrase of the Code
("National Industrial Tribunal") is never removed from running text. After the
removals, a line that stops mid-sentence is joined to the next line when that line
carries on in lower case. Section numbers, headings and anchors don't change.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
CODES = ['oshwc-code-2020', 'code-on-wages-2019', 'industrial-relations-code-2020', 'code-on-social-security-2020']

HEADER = re.compile(r'\[\s*PART\s+II\s*[—–-]\s*(?:SEC\.?\s*\d\s*(?:\(\s*[iv]+\s*\))?\s*\]?)?|\bSEC\.\s*\d\s*(?:\(\s*[iv]+\s*\))?\s*\]')
CITATION_LINE = re.compile(r'^(?:\s*\d{1,3}\s+of\s+\d{4}\.)+\s*$')
UNFINISHED = {'or', 'and', 'he', 'she', 'it', 'they', 'which', 'that', 'who', 'of', 'to', 'by', 'for', 'with', 'in',
              'under', 'any', 'such', 'his', 'her', 'their', 'be', 'is', 'are', 'shall', 'may', 'not', 'from', 'on',
              'as', 'unless', 'where', 'if', 'than', 'whom', 'whose', 'the', 'a', 'an'}


def spaced(t):
    """A heading as a pattern that tolerates the Gazette's odd spacing around hyphens."""
    parts = [re.escape(w) for w in re.sub(r'\s*-\s*', '-', t).split('-')]
    return r'\s*-\s*'.join(parts).replace(r'\ ', r'\s+')


def norm(t):
    return re.sub(r'\s*-\s*', '-', re.sub(r'\s+', ' ', t)).strip().rstrip('.').strip()


def clean(doc):
    titles = sorted({p['title'] for p in doc['provisions'] if p['num'] and p['title']}, key=len, reverse=True)
    body = ' '.join(p['text'] for p in doc['provisions'])
    # Headings that are also ordinary phrases of the Code are left alone in running text.
    common = {t for t in titles if len(re.findall(spaced(t), body)) >= 4}
    by_norm = {norm(t) for t in titles}
    stats = dict(header=0, citation=0, heading_line=0, heading_in_sentence=0, joined=0)
    for p in doc['provisions']:
        text = p['text']
        # 1. Headings dropped into a sentence.
        for t in titles:
            if t in common or len(t.split()) < 2:
                continue
            def drop(m):
                before = text[:m.start()].rstrip()
                prev = re.findall(r'[A-Za-z]+$', before)
                unfinished = before.endswith((',', ';')) or (prev and prev[0] in UNFINISHED)
                if unfinished or m.group('lower'):
                    stats['heading_in_sentence'] += 1
                    return ' ' if m.group('lower') else ''
                return m.group(0)
            text = re.sub(r'(?<=\S)[ \t]+' + spaced(t) + r'\.(?=(?P<lower>\s*(?:' + HEADER.pattern + r')?\s*[a-z])|[ \t]*\n|[ \t]*$)', drop, text)
        lines = []
        raw = text.split('\n')
        skip = False
        for i, l in enumerate(raw):
            if skip:
                skip = False
                continue
            first = i == 0                                      # "16. (1) ..." stays as it is
            # A heading split over two lines, with a margin citation stuck to the second
            # ("Application of sections 67 to" / "69. 63 of 1948.").
            if not first and i + 1 < len(raw):
                nxt = re.sub(r'(?:\s*\d{1,3}\s+of\s+\d{4}\.)+\s*$', '', raw[i + 1])
                if norm(l) not in by_norm and norm(l + ' ' + nxt) in by_norm:
                    stats['heading_line'] += 1
                    skip = True
                    continue
            n = len(HEADER.findall(l))
            if n:
                stats['header'] += n
                l = re.sub(r'\s{2,}', ' ', HEADER.sub(' ', l)).strip()
            if not first and CITATION_LINE.match(l):
                stats['citation'] += 1
                continue
            if not first and norm(l) in by_norm:               # a heading on a line of its own, any spacing
                stats['heading_line'] += 1
                continue
            if l:
                lines.append(l)
        # 2. Rejoin sentences split by what was removed: a line that stops mid-sentence
        #    carries on in the next line when that starts in lower case.
        out = []
        for l in lines:
            if out and re.match(r'[a-z]', l) and not re.search(r'[.:;—–]$', out[-1]):
                out[-1] = out[-1].rstrip() + ' ' + l
                stats['joined'] += 1
            else:
                out.append(l)
        p['text'] = '\n'.join(out)
    return stats


def main():
    docs = json.load(open(CORPUS, encoding='utf-8'))
    for d in docs:
        if d['slug'] in CODES:
            # Removing one heading line can expose the next ("…returns." over
            # "Appointment of …" over the page header): repeat until nothing changes.
            total = {}
            for _ in range(4):
                st = clean(d)
                total = {k: total.get(k, 0) + v for k, v in st.items()}
                if not any(st.values()):
                    break
            print(f"{d['slug']:32}", total)
    if '--apply' in sys.argv:
        json.dump(docs, open(CORPUS, 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)
        print('written')


if __name__ == '__main__':
    main()
