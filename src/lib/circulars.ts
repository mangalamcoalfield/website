// Shape of src/data/circulars-corpus.json (written by tools/build_circular_corpus.py).
export interface CircularEntry {
  id: string;
  /** upto2017 / 2018_2024: split out of a DGMS compilation. library: an individual PDF in the regulations library. */
  set: 'upto2017' | '2018_2024' | 'library';
  kind: 'digest' | 'conference' | 'circular' | 'notification';
  ref: string;
  title: string;
  date: string;
  year: number | null;
  section: string;
  regulation: string;
  page: number;
  page_end: number;
  /** Compilation file name, or an absolute URL for library entries. */
  pdf: string;
  /** Slug of the regulations-library page, for library entries. */
  library_slug: string;
  /** Issuing DGMS wing, from the reference ("(Tech)", "(Legis)" …), or "Not stated". */
  dept: string;
  /** Library entries: the original library title (number — subject). */
  full_title?: string;
  ocr: boolean;
  text: string;
}

/** The collection a circular belongs to — used as the search filter and the page badge. */
export function collectionOf(c: Pick<CircularEntry, 'set' | 'kind'>): string {
  if (c.set === 'library') return 'Individual circulars & notifications';
  if (c.set === '2018_2024') return 'Circulars 2018–2024';
  if (c.kind === 'digest') return 'Regulation-wise digest (to 2017)';
  if (c.kind === 'conference') return 'Safety conference recommendations';
  return 'Circulars 1995–2017';
}

// DGMS spells the same thing several ways across sixty years of circulars
// ("headgear", "head gear", "head-gear"). Search matches words, so a circular
// that only says "head gear" was invisible to a search for "headgear". Each page
// carries the other spelling of any such word it uses, so either spelling finds it.
const PAIRS: [joined: string, split: string][] = [
  ['headgear', 'head gear'], ['headframe', 'head frame'], ['pithead', 'pit head'],
  ['overwinding', 'over winding'], ['firedamp', 'fire damp'], ['shotfiring', 'shot firing'],
  ['depillaring', 'de pillaring'], ['roadway', 'road way'], ['shotfirer', 'shot firer'],
];
export function searchVariants(text: string): string[] {
  const out: string[] = [];
  for (const [joined, split] of PAIRS) {
    const [a, b] = split.split(' ');
    const hasSplit = new RegExp(`\\b${a}[\\s-]+${b}`, 'i').test(text);
    const hasJoined = new RegExp(`\\b${joined}`, 'i').test(text);
    if (hasSplit && !hasJoined) out.push(joined);
    if (hasJoined && !hasSplit) out.push(split);
  }
  return out;
}

export const COLLECTIONS = [
  'Individual circulars & notifications',
  'Circulars 2018–2024',
  'Circulars 1995–2017',
  'Regulation-wise digest (to 2017)',
  'Safety conference recommendations',
] as const;
