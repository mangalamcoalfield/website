/**
 * Tiny zero-dependency retrieval: BM25 ranking over the bot corpus, plus
 * answer-grounded source selection.
 *
 * Two things matter here. Ranking is BM25 rather than raw term overlap, because
 * the corpus is lopsided — a few hundred regulation summaries against a handful
 * of site pages — which made short regulation chunks outrank the pages that
 * actually answer a question. And citations are chosen by comparing each
 * retrieved chunk against the ANSWER, not the question, so a document that
 * merely shares a word with the question is never shown as a source.
 */
import type { CorpusChunk } from './bot-corpus';

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
  'was', 'were', 'be', 'with', 'at', 'by', 'it', 'its', 'as', 'that', 'this',
  'what', 'who', 'how', 'why', 'when', 'where', 'do', 'does', 'can', 'i', 'you',
  'your', 'we', 'our', 'me', 'my', 'about', 'tell', 'please',
  // common verbs/fillers that otherwise cause spurious "source" matches
  'will', 'would', 'should', 'could', 'shall', 'may', 'might', 'must', 'has',
  'have', 'had', 'get', 'got', 'like', 'want', 'need', 'know', 'see', 'give',
  'make', 'made', 'going', 'win', 'won', 'match', 'today', 'tonight', 'tomorrow',
  'now', 'also', 'just', 'very', 'more', 'most', 'some', 'any', 'all', 'into',
  'from', 'they', 'them', 'there', 'here', 'which', 'much', 'many', 'such',
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2 && !STOP.has(t));
}

export interface Scored {
  chunk: CorpusChunk;
  score: number;
  /** Distinct tokens in this chunk, kept so citations can be checked later. */
  tokens: Set<string>;
}

export interface Retrieval {
  /** All matching chunks, best first. */
  results: Scored[];
  /** The chunks to put in front of the model. */
  top: CorpusChunk[];
  /**
   * Sources worth showing to the reader, chosen from `top` by how much
   * distinctive vocabulary each shares with the answer that was produced.
   */
  cite(answer: string, max?: number): CorpusChunk[];
}

// BM25. Term overlap alone ranked badly here because the corpus is ~300
// regulation summaries against ~15 site pages, so an ordinary English word can
// be statistically rarer than the mine's own name ("method" appears in 3 docs,
// "Amlabad" in 4). Weighting by inverse document frequency, and normalising
// length the BM25 way rather than by sqrt, stops a short regulation summary
// outranking the page that actually answers the question.
const K1 = 1.2;
const B = 0.75;

/** A term is "distinctive" if it is far from ubiquitous in the corpus. */
const DISTINCTIVE_DF = 0.15;
/** Distinctive terms a source must share with the answer to be cited. */
const MIN_ANSWER_OVERLAP = 3;
const TOP_K = 5;

export function retrieve(question: string, corpus: CorpusChunk[], k = TOP_K): Retrieval {
  const qTerms = [...new Set(tokenize(question))];
  const docs = corpus.map((c) => tokenize(`${c.title} ${c.text}`));
  const N = docs.length;

  if (qTerms.length === 0 || N === 0) {
    return { results: [], top: [], cite: () => [] };
  }

  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) || 0) + 1);
  const avgLen = docs.reduce((a, d) => a + d.length, 0) / N;
  const idf = (t: string) => {
    const n = df.get(t) || 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };
  const distinctive = (t: string) => (df.get(t) || 0) / N < DISTINCTIVE_DF;

  const results = corpus
    .map((chunk, i) => {
      const d = docs[i];
      const tf = new Map<string, number>();
      for (const t of d) tf.set(t, (tf.get(t) || 0) + 1);
      let score = 0;
      for (const t of qTerms) {
        const f = tf.get(t) || 0;
        if (!f) continue;
        score += idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / avgLen)));
      }
      return { chunk, score, tokens: new Set(d) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const topScored = results.slice(0, k);

  return {
    results,
    top: topScored.map((s) => s.chunk),
    // Citations are grounded in the answer, not the question. Matching the
    // question is what produced chips like the Mineral (Auction) Rules for
    // "what mining method is used at Amlabad?" -- the rules text happens to
    // contain "mining" and "method", but nothing it says reached the answer.
    // Requiring real overlap with the answer removes those, and ordering by
    // that overlap puts the page the answer actually came from first.
    cite(answer: string, max = 2): CorpusChunk[] {
      const answerTerms = new Set(tokenize(answer));
      return topScored
        .map((s) => ({
          chunk: s.chunk,
          overlap: [...answerTerms].filter((t) => s.tokens.has(t) && distinctive(t)).length,
        }))
        .filter((s) => s.overlap >= MIN_ANSWER_OVERLAP)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, max)
        .map((s) => s.chunk);
    },
  };
}
