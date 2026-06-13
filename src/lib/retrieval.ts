/**
 * Tiny zero-dependency retrieval: score corpus chunks by term overlap with the
 * question. `retrieveScored` also reports `rareHits` — distinct query terms that
 * match but are NOT ubiquitous across the corpus (coal/mining/mine appear almost
 * everywhere, so matching them means little). Callers use rareHits to decide
 * whether a chunk is relevant enough to show as a cited source.
 */
import type { CorpusChunk } from './bot-corpus';

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
  'was', 'were', 'be', 'with', 'at', 'by', 'it', 'its', 'as', 'that', 'this',
  'what', 'who', 'how', 'why', 'when', 'where', 'do', 'does', 'can', 'i', 'you',
  'your', 'we', 'our', 'me', 'my', 'about', 'tell', 'please',
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2 && !STOP.has(t));
}

export interface Scored {
  chunk: CorpusChunk;
  score: number;
  rareHits: number;
}

export function retrieveScored(question: string, corpus: CorpusChunk[]): Scored[] {
  const qTerms = [...new Set(tokenize(question))];
  if (qTerms.length === 0 || corpus.length === 0) return [];

  // Per-chunk token sets + corpus document frequency (for the "rare" test).
  const docTokens = corpus.map((c) => new Set(tokenize(`${c.title} ${c.text}`)));
  const df = new Map<string, number>();
  for (const toks of docTokens) for (const t of toks) df.set(t, (df.get(t) || 0) + 1);
  const N = corpus.length;

  return corpus
    .map((chunk, i) => {
      const toks = docTokens[i];
      let score = 0;
      let rareHits = 0;
      for (const qt of qTerms) {
        if (toks.has(qt)) {
          score += 2.5;
          if ((df.get(qt) || 0) / N < 0.5) rareHits += 1; // informative (not corpus-ubiquitous)
        }
      }
      score = score / Math.sqrt(toks.size + 1); // mild length normalisation
      return { chunk, score, rareHits };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Top-k chunks by score (used to build the grounding context). */
export function retrieve(question: string, corpus: CorpusChunk[], k = 5): CorpusChunk[] {
  return retrieveScored(question, corpus).slice(0, k).map((s) => s.chunk);
}
