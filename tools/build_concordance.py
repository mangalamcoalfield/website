"""Concordance: where each regulation of the Coal Mines Regulations, 2017 goes in
the Draft OSH&WC (Coal Mines) Regulations, 2026, and what changed in its wording.

    python tools/build_concordance.py        (reads src/data/statutes-corpus.json)

Writes src/data/concordance-cmr2017-draft2026.json, rendered at
/regulations/concordance/cmr-2017-draft-2026. Machine-assisted and labelled so:

  * each CMR 2017 regulation is matched to the draft regulation whose heading and
    text are closest (heading-word overlap and TF-IDF cosine of the text);
  * where the draft has no counterpart, the OSH&WC (Central) Rules, 2026 and the
    OSH&WC Code, 2020 are searched the same way — notices, returns and
    certificates moved there — and offered as "likely now in", never asserted;
  * matched pairs get a word-level diff and a class: same text, minor changes,
    expanded (the old wording kept, new text added), revised (by the share of
    the CMR 2017 wording kept and the change in length), or merged where the draft folds
    several CMR 2017 regulations into one.
Nothing here is legal advice; the page says to check the texts themselves.
"""
import json, math, os, re
from collections import Counter
from difflib import SequenceMatcher

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, 'src', 'data', 'statutes-corpus.json')
OUT = os.path.join(ROOT, 'src', 'data', 'concordance-cmr2017-draft2026.json')
FROM, TO = 'coal-mines-regulations-2017', 'draft-oshwc-coal-mines-regulations-2026'
ELSEWHERE = ['oshwc-code-central-rules-2026', 'oshwc-code-2020']

STOP = set('''the of and or to in a an by for be shall any such as on at with from that this is are which
every mine mines regulation regulations rule rules section sub provided where person persons other than not
no its it their have has been may made being all said under'''.split())


def tok(t):
    return [w for w in re.findall(r'[a-z]{3,}', t.lower()) if w not in STOP]


def body(p):
    """The provision's text without its number-and-heading line."""
    return p['text'].split('\n', 1)[-1] if '\n' in p['text'] else re.sub(r'^\S+\s+', '', p['text'])


def main():
    docs = {d['slug']: d for d in json.load(open(CORPUS, encoding='utf-8'))}
    A = [p for p in docs[FROM]['provisions'] if p['num']]
    B = [p for p in docs[TO]['provisions'] if p['num']]
    E = [(slug, p) for slug in ELSEWHERE if slug in docs for p in docs[slug]['provisions'] if p['num']]

    every = [tok(body(p)[:4000]) for p in A + B + [p for _, p in E]]
    df = Counter(w for d in every for w in set(d))
    n_docs = len(every)

    def vec(p):
        c = Counter(tok(body(p)[:4000]))
        v = {w: (1 + math.log(k)) * math.log(n_docs / df.get(w, 1)) for w, k in c.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1
        return {w: x / norm for w, x in v.items()}

    def cos(a, b):
        return sum(x * b.get(w, 0) for w, x in a.items())

    def jac(a, b):
        a, b = set(tok(a)), set(tok(b))
        return len(a & b) / len(a | b) if a and b else 0.0

    VA, VB, VE = [vec(p) for p in A], [vec(p) for p in B], [vec(p) for _, p in E]

    def words(t):
        return re.findall(r'\S+', re.sub(r'\s+', ' ', t))

    def diff(a, b):
        """Word-level diff as [op, text] runs: '=' same, '-' removed, '+' added."""
        wa, wb = words(a), words(b)
        sm = SequenceMatcher(None, wa, wb, autojunk=False)
        out = []
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op == 'equal':
                w = wa[i1:i2]                             # long unchanged stretches keep only their context
                out.append(['=', ' '.join(w) if len(w) <= 24 else ' '.join(w[:10]) + ' … ' + ' '.join(w[-10:])])
            else:
                if i2 > i1:
                    out.append(['-', ' '.join(wa[i1:i2])])
                if j2 > j1:
                    out.append(['+', ' '.join(wb[j1:j2])])
        same = sum(i2 - i1 for op, i1, i2, _, _ in sm.get_opcodes() if op == 'equal')
        # Share of the CMR 2017 wording kept, and how much longer the draft's text is.
        return out, same / max(len(wa), 1), len(wb) / max(len(wa), 1)

    # Pair them one-to-one first, best pairs first, so "Practical experience of
    # candidates" (four regulations, four counterparts) don't all land on one.
    def score(i, j):
        return 0.55 * jac(A[i]['title'], B[j]['title']) + 0.45 * cos(VA[i], VB[j])
    pairs = sorted(((score(i, j), i, j) for i in range(len(A)) for j in range(len(B))), reverse=True)
    match, taken = {}, set()
    for sc, i, j in pairs:
        if i in match or j in taken:
            continue
        head, text = jac(A[i]['title'], B[j]['title']), cos(VA[i], VB[j])
        if (head >= 0.5 and text >= 0.15) or text >= 0.45 or head >= 0.99:
            match[i] = (j, head, text)
            taken.add(j)
    # Regulations the draft folds into another (the notices of opening, reopening and
    # annual returns now sit in its "General management"): a text match to a draft
    # regulation already taken.
    for i in range(len(A)):
        if i in match:
            continue
        free = [(score(i, j), j) for j in range(len(B)) if j not in taken]
        sc, j = max(free) if free else (0, -1)
        if sc >= 0.25:                                    # a looser pair still available
            match[i] = (j, jac(A[i]['title'], B[j]['title']), cos(VA[i], VB[j]))
            taken.add(j)
            continue
        sc, j = max((cos(VA[i], VB[j]), j) for j in range(len(B)))
        if sc >= 0.35:
            match[i] = (j, jac(A[i]['title'], B[j]['title']), sc)

    rows = []
    for i, a in enumerate(A):
        row = dict(num=a['num'], title=a['title'], anchor=a['id'])
        if i in match:
            j, head, text = match[i]
            b = B[j]
            d, kept, grew = diff(body(a), body(b))
            folded = sum(1 for k in match.values() if k[0] == j) > 1
            row.update(to=dict(slug=TO, num=b['num'], title=b['title'], anchor=b['id']),
                       sure='high' if (head >= 0.6 and text >= 0.35) or text >= 0.6 else 'medium',
                       change='merged' if folded else 'same' if kept >= 0.97 and grew <= 1.05
                       else 'expanded' if kept >= 0.8 and grew > 1.3 else 'minor' if kept >= 0.8 else 'revised',
                       kept=round(kept, 3), grew=round(grew, 2))
            if not folded and row['change'] != 'same':
                row['diff'] = d
        else:
            cands = sorted(((0.55 * jac(a['title'], p['title']) + 0.45 * cos(VA[i], VE[k]), k) for k, (_, p) in enumerate(E)), reverse=True)[:2]
            row['likely'] = [dict(slug=E[k][0], doc=docs[E[k][0]]['title'], num=E[k][1]['num'], label=E[k][1]['label'],
                                  title=E[k][1]['title'], anchor=E[k][1]['id']) for sc, k in cands if sc >= 0.2]
        rows.append(row)

    used = {r['to']['num'] for r in rows if 'to' in r}
    new = [dict(num=b['num'], title=b['title'], anchor=b['id']) for b in B if b['num'] not in used]
    out = dict(source=dict(slug=FROM, title=docs[FROM]['title']), target=dict(slug=TO, title=docs[TO]['title']),
               rows=rows, new_in_draft=new)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    c = Counter(r.get('change', 'not in draft') for r in rows)
    print(f'{len(rows)} CMR 2017 regulations: {dict(c)}; {len(new)} draft regulations with no CMR 2017 match')
    print('size KB', os.path.getsize(OUT) // 1024)


if __name__ == '__main__':
    main()
