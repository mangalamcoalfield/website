/**
 * Tiny zero-dependency retrieval: score corpus chunks by term overlap with the
 * question and return the top-k. Good enough to ground a small, well-curated
 * corpus without an embeddings service (keeps runtime cost ~nil).
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

export function retrieve(question: string, corpus: CorpusChunk[], k = 5): CorpusChunk[] {
  const qTerms = tokenize(question);
  if (qTerms.length === 0) return [];
  const qSet = new Set(qTerms);

  const scored = corpus.map((chunk) => {
    const text = `${chunk.title} ${chunk.text}`.toLowerCase();
    const terms = tokenize(text);
    let score = 0;
    const seen = new Set<string>();
    for (const t of terms) {
      if (qSet.has(t)) {
        score += 1;
        // small bonus the first time each query term is matched (coverage > frequency)
        if (!seen.has(t)) { score += 1.5; seen.add(t); }
      }
    }
    // normalise slightly by chunk length so long chunks don't always win
    score = score / Math.sqrt(terms.length + 1);
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);
}
