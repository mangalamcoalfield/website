// Shape of src/data/circulars-corpus.json (written by tools/build_circular_corpus.py).
export interface CircularEntry {
  id: string;
  set: 'upto2017' | '2018_2024';
  kind: 'digest' | 'conference' | 'circular' | 'notification';
  ref: string;
  title: string;
  date: string;
  year: number | null;
  section: string;
  regulation: string;
  page: number;
  page_end: number;
  pdf: string;
  ocr: boolean;
  text: string;
}

/** The collection a circular belongs to — used as the search filter and the page badge. */
export function collectionOf(c: Pick<CircularEntry, 'set' | 'kind'>): string {
  if (c.set === '2018_2024') return 'Circulars 2018–2024';
  if (c.kind === 'digest') return 'Regulation-wise digest (to 2017)';
  if (c.kind === 'conference') return 'Safety conference recommendations';
  return 'Circulars 1995–2017';
}

export const COLLECTIONS = [
  'Circulars 2018–2024',
  'Circulars 1995–2017',
  'Regulation-wise digest (to 2017)',
  'Safety conference recommendations',
] as const;
