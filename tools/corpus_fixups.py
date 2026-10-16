"""Re-apply the corpus builders' finishing passes to the committed corpora, without
the source PDFs (which live only on the machine that ran tools/circular_pages.py and
tools/library_pages.py).

    python tools/corpus_fixups.py

  * strips personal contact details (tools/pii.py) from both corpora;
  * re-splits the numbered statutes with the current splitter, from their stored text;
  * takes each statute's status, number and date from src/data/regulations-full-seed.json,
    so the full-text pages say what the library says.

Idempotent. The full builders do all of this themselves; this is for when only the
JSON is at hand.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from pii import scrub
import build_statute_corpus as S

DATA = os.path.join(ROOT, 'src', 'data')


def load(name):
    return json.load(open(os.path.join(DATA, name), encoding='utf-8'))


def save(name, obj):
    # Same bytes the builders write on Windows (CRLF), so a run here doesn't rewrite every line.
    json.dump(obj, open(os.path.join(DATA, name), 'w', encoding='utf-8', newline='\r\n'), ensure_ascii=False, indent=0)


def circulars():
    entries = load('circulars-corpus.json')
    changed = 0
    for e in entries:
        for k in ('text', 'title', 'full_title'):
            if e.get(k):
                t = scrub(e[k])
                changed += t != e[k]
                e[k] = t
    save('circulars-corpus.json', entries)
    print(f'circulars: {len(entries)} entries, {changed} fields scrubbed')


def statutes():
    docs = load('statutes-corpus.json')
    seed = {r['slug']: r for r in load('regulations-full-seed.json')}
    for d in docs:
        for p in d['provisions']:
            p['text'] = scrub(p['text'])
        if d['numbered']:
            before = sum(1 for p in d['provisions'] if p['num'])
            provs = S.split('\n'.join(p['text'] for p in d['provisions']), seed.get(d['slug'], d)['title'])
            after = sum(1 for p in provs if p['num'])
            if after >= before:
                d['provisions'] = provs
            else:
                print(f'  kept the old split of {d["slug"]} ({before} provisions; the splitter found {after})')
        r = seed.get(d['slug'])
        if r:
            d['title'] = S.TEXT_IS.get(d['slug'], r['title'])
            d['status'] = r.get('status') or ''
            d['doc_number'] = r.get('doc_number') or ''
            d['date'] = r.get('issued_date') or ''
    save('statutes-corpus.json', docs)
    print(f'statutes: {len(docs)} documents, {sum(len(d["provisions"]) for d in docs)} sections')
    print('numbering gaps (omitted sections are normal):')
    S.report(docs)


if __name__ == '__main__':
    circulars()
    statutes()
