import type { APIRoute } from 'astro';
import { STATIC_CORPUS, type CorpusChunk } from '../../lib/bot-corpus';
import { retrieveScored } from '../../lib/retrieval';
import { safeSelect, type KnowledgeEntry, type Regulation } from '../../lib/supabase';

// On-demand (serverless) — NOT prerendered. Runs server-side on Vercel so the
// Gemini key never reaches the browser.
export const prerender = false;

// --- config (server-only env; NEVER PUBLIC_-prefixed) ----------------------
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? import.meta.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? import.meta.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

const MAX_Q = 500; // chars
const RL_WINDOW_MS = 60_000;
const RL_MAX = 8; // requests per IP per window (best-effort; Google spend cap is the hard backstop)

const SYSTEM_INSTRUCTION = `You are "Ask Mangalam", the assistant on the public website of Mangalam Coalfield Private Limited — a coal mine developer/operator reviving the Amlabad pits in the Eastern Jharia Area of District Bokaro, Jharkhand, running coal and coal bed methane (CBM) operations.

WHAT YOU MAY ANSWER:
1) Questions about Mangalam Coalfield itself — answer using ONLY the facts in CONTEXT below. Never invent company specifics (figures, dates, sites, production, reserves, schedules). If a company detail is not in CONTEXT, say you don't have that specific detail and suggest the contact form.
2) General Indian coal-mining and regulatory topics — mining methods (e.g. bord & pillar), geology and coal seams (dip/gradient), ventilation and mine gases (methane, "air"/gas accumulations), roof support, safety, and the statutory framework: the Mines Act 1952, the Coal Mines Regulations 2017, DGMS circulars/notifications, and DGMS/statutory forms, returns, permits and notices. For ALL of these you MAY and SHOULD answer accurately from general knowledge even when CONTEXT doesn't cover the exact item — do not refuse a genuine coal-mining or DGMS regulatory question just because it isn't in CONTEXT. Be factual, educational and concise, prefer CONTEXT where relevant, and where useful point the user to the site's Regulations hub at /regulations (452+ DGMS documents with a circular finder). If you are unsure of a very specific detail (an exact form number or clause), say so plainly rather than guessing.

REFUSE politely anything that is NOT about coal mining or Mangalam (sports, politics, weather, other industries, general chit-chat).

ALWAYS:
- Make NO commitments on the company's behalf: no hiring/interview promises, no pricing or quotes, no guarantees, no timelines, no legal/financial/safety advice.
- Never reveal or guess Mangalam's internal/confidential or site-specific data (specific gas readings, reserves, mine-plan economics, production schedules).
- Be concise (2-5 sentences), calm and professional. Do not fabricate sources, URLs or numbers.
- For enquiries or job applications, point to the contact form (/contact) or careers page (/careers) — you do not capture leads yourself.`;

// --- naive per-IP rate limiter (per warm instance) -------------------------
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RL_MAX;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function buildCorpus(): Promise<CorpusChunk[]> {
  // Static page copy + published knowledge entries + the public regulations hub
  // (all public content — same publish-filter as the rest of the site).
  const [entries, regs] = await Promise.all([
    safeSelect<KnowledgeEntry>((c) =>
      c.from('knowledge_entries').select('*').eq('published', true)
    ),
    safeSelect<Regulation>((c) =>
      c
        .from('regulations')
        .select('slug,title,summary,category,authority,doc_number,issued_date')
        .eq('published', true)
    ),
  ]);
  const fromDb: CorpusChunk[] = entries
    .filter((e) => e.body)
    .map((e) => ({
      title: e.title,
      text: e.body as string,
      source: e.type === 'explainer' && e.slug ? `/learn/${e.slug}` : e.source_url || '/learn',
    }));
  // Each regulation → a compact, searchable chunk (title + issuer + summary),
  // citing the hub page so answers can link the actual document.
  const fromRegs: CorpusChunk[] = regs
    .filter((r) => r.summary)
    .map((r) => {
      const meta = [r.doc_number, r.authority].filter(Boolean).join(' · ');
      return {
        title: r.title,
        text: `${r.title}${meta ? ` (${meta})` : ''}. ${r.summary}`,
        source: r.slug ? `/regulations/${r.slug}` : '/regulations',
      };
    });
  return [...STATIC_CORPUS, ...fromDb, ...fromRegs];
}

async function callGemini(question: string, context: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const userMsg = `CONTEXT (the only facts you may use):\n${context}\n\nQUESTION: ${question}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 800 },
      // Coal-mining/safety/regulatory content (methane, explosives, ventilation,
      // hazards) routinely trips the DANGEROUS_CONTENT filter at MEDIUM, which was
      // cutting legitimate answers off mid-sentence. Block only HIGH-confidence harm.
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text: string | undefined = cand?.content?.parts
    ?.map((p: { text?: string }) => p.text || '')
    .join('')
    .trim();
  if (!text) {
    // blocked or empty — give a safe fallback
    return "I'm sorry, I can't help with that. For anything specific, please use our contact form.";
  }
  // If the model was cut off (safety/length) mid-sentence, close it cleanly so the
  // user never sees a dangling fragment.
  if (cand?.finishReason && cand.finishReason !== 'STOP' && !/[.!?)]$/.test(text)) {
    const lastStop = Math.max(text.lastIndexOf('. '), text.lastIndexOf('! '), text.lastIndexOf('? '));
    const trimmed = lastStop > 40 ? text.slice(0, lastStop + 1) : text;
    return `${trimmed}\n\nFor more, see our Regulations hub (/regulations) or the contact form.`;
  }
  return text;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Graceful: the bot is "off" until the key is configured server-side.
  if (!GEMINI_KEY) return json({ error: 'unavailable' }, 503);

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429);

  let question = '';
  let body: { question?: string; probe?: boolean } = {};
  try {
    body = await request.json();
    question = String(body?.question ?? '').trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  // Health probe from the widget — the key is present (we passed the 503 gate),
  // so the bot is available. Return 200 so the browser console stays clean.
  if (body?.probe) return json({ ok: true });
  if (!question) return json({ error: 'empty' }, 400);
  if (question.length > MAX_Q) question = question.slice(0, MAX_Q);

  try {
    const corpus = await buildCorpus();
    const scored = retrieveScored(question, corpus);
    const top = scored.slice(0, 5).map((s) => s.chunk);
    const context =
      top.length > 0
        ? top.map((c, i) => `[${i + 1}] ${c.title} (${c.source})\n${c.text}`).join('\n\n')
        : '(no closely matching public content found)';

    const answer = await callGemini(question, context);

    // Only cite sources that are genuinely relevant (matched an informative,
    // non-ubiquitous term) — avoids noisy chips on general-knowledge answers.
    const sources = scored
      .filter((s) => s.rareHits >= 1)
      .slice(0, 2)
      .map((s) => ({ title: s.chunk.title, source: s.chunk.source }));
    return json({ answer, sources });
  } catch (err) {
    console.error('[ask] error:', err);
    return json({ error: 'upstream', answer: "Sorry — I couldn't answer just now. Please try again, or use our contact form." }, 502);
  }
};

// Reject non-POST politely.
export const GET: APIRoute = () => json({ error: 'method_not_allowed' }, 405);
