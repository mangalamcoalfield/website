"""How readable a machine-read (OCR) circular is: the share of its words that also
occur in the circulars that have a real text layer. Clean OCR scores ~0.95; a
garbled scan (tables of approval numbers read as noise, faint stamps) scores well
under 0.6. Re-OCR (tools/reocr_poor.py) lifts the worst into the 0.6s while their
numbers, dates and equipment names stay unreliable, so the line is 0.7. Pages below POOR warn the reader and keep the text out of the search
index (the reference and title stay searchable)."""
import re
from collections import Counter

POOR = 0.7


def annotate(entries):
    vocab = Counter(w for e in entries if not e['ocr'] for w in re.findall(r'[a-z]{3,}', e['text'].lower()))
    known = {w for w, n in vocab.items() if n >= 3}
    for e in entries:
        e.pop('ocr_quality', None)
        if not e['ocr']:
            continue
        words = re.findall(r'[A-Za-z]{3,}', e['text'])
        e['ocr_quality'] = round(sum(1 for w in words if w.lower() in known) / len(words), 3) if words else 0.0
    return entries
