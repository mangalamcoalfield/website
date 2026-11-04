// A regulation's status, everywhere the site shows one. Four values:
//   in_force    the law today
//   notified    final text published in the Gazette, in force from a later date
//               (the date goes in status_note)
//   draft       published for comments, not law
//   superseded  replaced or repealed
export type RegStatus = 'in_force' | 'notified' | 'draft' | 'superseded';

/** Long label, for a document's own page. */
export const statusLabel = (s: string) =>
  s === 'in_force' ? 'In force' : s === 'notified' ? 'Notified — not yet in force' : s === 'draft' ? 'Draft — not in force' : s === 'superseded' ? 'Superseded' : '';

/** Short label, for badges in lists. */
export const statusShort = (s: string) =>
  s === 'in_force' ? 'In force' : s === 'notified' ? 'Not yet in force' : s === 'draft' ? 'Draft' : s === 'superseded' ? 'Superseded' : s;

/** Badge colours: drafts and not-yet-in-force share the "not law yet" colour. */
export const statusBadge = (s: string) =>
  s === 'in_force' ? 'bg-primary/15 text-primary' : s === 'draft' || s === 'notified' ? 'bg-secondary/20 text-[#9ed3c4]' : 'bg-white/10 text-muted-foreground';

/** Whether a document number already says what it is ("No. 22/2/2014-ASO", "F. No. CEA-…",
 *  "G.S.R. 345(E)", "S.O. 5683(E)", "Act 35 of 1952", "DGMS (Legis) Circular No. 01"), so
 *  the page shouldn't print its own "No." label before it. */
export const numberSaysItself = (n: string) => /\bNo\b|^(?:G\.?\s*S\.?\s*R|S\.?\s*O|Act|GSR|SO)\b/i.test(n);

/** List order: what is law today first, then what is coming, then what is gone. */
export const statusRank = (s: string) => ({ in_force: 0, notified: 1, draft: 2, superseded: 3 } as Record<string, number>)[s] ?? 4;
