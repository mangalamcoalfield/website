// Shape of src/data/statutes-corpus.json (written by tools/build_statute_corpus.py):
// the library's Acts, Codes, Rules, Regulations and guidelines, split into their
// numbered provisions so a search lands on "Regulation 78", not just on CMR 2017.
export interface Provision {
  /** Anchor on the full-text page ("p-78", "p-preamble", "p-pages-1-3"). */
  id: string;
  /** "78", "72B"; '' for a preamble, schedules or a page range. */
  num: string;
  /** "Regulation 78", "Section 40", "Schedules", "Pages 1–3". */
  label: string;
  /** The provision's heading, '' where the extraction lost it. */
  title: string;
  text: string;
}
export interface StatuteDoc {
  slug: string;
  title: string;
  category: string;
  category_label: string;
  status: string;
  doc_number: string;
  date: string;
  year: number | null;
  pdf: string;
  ocr: boolean;
  pages: number;
  /** Split by numbered provision (an Act, Code, Rules or Regulations), rather than by page. */
  numbered: boolean;
  /** Library slugs folded into this one because they are copies of the same instrument. */
  also?: string[];
  provisions: Provision[];
}

/** Search scopes, stored as the Pagefind `kind` filter on every indexed page. */
export const KIND_STATUTE = 'Acts, rules & regulations';
export const KIND_CIRCULAR = 'DGMS circulars';

/** Order the instrument groups appear in, everywhere. */
export const INSTRUMENT_ORDER = [
  'Coal Mines Regulations 2017', 'Mines Act, Rules & Regulations', 'Labour Codes & Rules', 'MMDR Act & Rules',
  'Environment & Forest', 'Electricity (CEA)', 'Ministry of Coal', 'Drafts & consultations',
];

export const provisionHeading = (p: Pick<Provision, 'label' | 'title'>) =>
  p.title && p.title !== p.label ? `${p.label} — ${p.title}` : p.label;
