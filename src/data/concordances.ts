// The concordances published on the Regulation Desk: one page per old → new transition,
// /regulations/concordance/<key>, from src/data/concordance-<key>.json (tools/build_concordance.py).
// A pair is listed here only once its matches have been checked; Mines Act 1952 →
// OSH&WC Code 2020 waits until the Code's section headings are restored.
export interface ConcordanceMeta {
  key: string;
  /** Short names for the two sides, as used on the page ("CMR 2017", "Draft 2026"). */
  from: string; to: string;
  /** "regulation", "rule", "section": what each side's numbered unit is called. */
  fromUnit: string; toUnit: string;
  heading: string;
  /** One sentence on what changed between the two and whether the new text is law. */
  context: string;
  /** Whether the new text is still a draft (changes the wording of the labels). */
  draft: boolean;
}

export const CONCORDANCES: ConcordanceMeta[] = [
  {
    key: 'cmr-2017-draft-2026', from: 'CMR 2017', to: 'Draft 2026', fromUnit: 'Regulation', toUnit: 'Regulation', draft: true,
    heading: 'CMR 2017 → Draft OSH&WC (Coal Mines) Regulations 2026',
    context: "The 2026 regulations are a draft (G.S.R. 67(E), 28 Jan 2026), not in force: CMR 2017 continues under the OSH&WC Code's savings clause until they are notified as final.",
  },
  {
    key: 'mines-rules-1955-oshwc-central-rules-2026', from: 'Mines Rules 1955', to: 'OSH&WC Central Rules 2026', fromUnit: 'Rule', toUnit: 'Rule', draft: false,
    heading: 'Mines Rules 1955 → OSH&WC (Central) Rules 2026',
    context: 'The OSH&WC (Central) Rules, 2026 (G.S.R. 345(E), 8 May 2026) replaced the Mines Rules, 1955. They are written for every kind of establishment, so many mine rules were rewritten or folded into general rules rather than carried over.',
  },
  {
    key: 'mvtr-1966-oshwc-central-rules-2026', from: 'MVT Rules 1966', to: 'OSH&WC Central Rules 2026', fromUnit: 'Rule', toUnit: 'Rule', draft: false,
    heading: 'Mines Vocational Training Rules 1966 → OSH&WC (Central) Rules 2026',
    context: "The OSH&WC (Central) Rules, 2026 (G.S.R. 345(E), 8 May 2026) replaced the Mines Vocational Training Rules, 1966; vocational training is now in the Central Rules' training chapter.",
  },
  {
    key: 'cea-2010-cea-2023', from: 'CEA 2010', to: 'CEA 2023', fromUnit: 'Regulation', toUnit: 'Regulation', draft: false,
    heading: 'CEA Safety Regulations 2010 → CEA Safety Regulations 2023',
    context: 'The CEA (Measures relating to Safety and Electric Supply) Regulations, 2023 replaced the 2010 Regulations, which mines followed for electrical safety.',
  },
];

/** Each pair's two documents (statute slugs), as in tools/build_concordance.py PAIRS. */
export const CONCORDANCE_SIDES: Record<string, [string, string]> = {
  'cmr-2017-draft-2026': ['coal-mines-regulations-2017', 'draft-oshwc-coal-mines-regulations-2026'],
  'mines-act-1952-oshwc-code-2020': ['mines-act-1952', 'oshwc-code-2020'],
  'mines-rules-1955-oshwc-central-rules-2026': ['mines-rules-1955', 'oshwc-code-central-rules-2026'],
  'mvtr-1966-oshwc-central-rules-2026': ['mines-vocational-training-rules-1966', 'oshwc-code-central-rules-2026'],
  'cea-2010-cea-2023': ['cea-measures-relating-to-safety-regulations-2010', 'cea-safety-electric-supply-regulations-2023'],
};
