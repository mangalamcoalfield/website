import type { APIRoute } from 'astro';
import { STATIC_CORPUS, type CorpusChunk } from '../../lib/bot-corpus';
import { retrieve } from '../../lib/retrieval';
import { safeSelect, type KnowledgeEntry } from '../../lib/supabase';

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

const SYSTEM_INSTRUCTION = `You are "Ask Mangalam", a helpful assistant on the public website of Mangalam Coalfield Private Limited (a coal mine developer/operator reviving the Amlabad pits in Eastern Jharia, Jharkhand, with coal and coal bed methane lines).

STRICT RULES:
- Answer ONLY using the CONTEXT provided below. If the answer is not in the context, say you don't have that information and point the user to the relevant page or the contact form.
- Stay strictly on topic: Mangalam Coalfield and general Indian coal-mining (operations, safety, regulation, the science, careers process, CSR). Politely refuse anything off-topic.
- Make NO commitments on the company's behalf: no hiring decisions or interview promises, no pricing or quotes, no guarantees, no timelines, no legal/financial/safety advice.
- Never reveal or speculate about internal, confidential, employee, production, reserves, geology, mine-plan or site-specific gas data. Treat everything as public.
- Be concise (2-4 short sentences). Use a calm, professional tone. Do not invent facts, sources, figures or URLs.
- For enquiries or applications, direct users to the contact form (/contact) or careers page (/careers) — you do not capture leads yourself.`;

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
  // Static page copy + any published knowledge entries (public content only).
  const entries = await safeSelect<KnowledgeEntry>((c) =>
    c.from('knowledge_entries').select('*').eq('published', true)
  );
  const fromDb: CorpusChunk[] = entries
    .filter((e) => e.body)
    .map((e) => ({
      title: e.title,
      text: e.body as string,
      source: e.type === 'explainer' && e.slug ? `/learn/${e.slug}` : e.source_url || '/learn',
    }));
  return [...STATIC_CORPUS, ...fromDb];
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
      generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 400 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || '')
    .join('')
    .trim();
  if (!text) {
    // blocked or empty — give a safe fallback
    return "I'm sorry, I can't help with that. For anything specific, please use our contact form.";
  }
  return text;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Graceful: the bot is "off" until the key is configured server-side.
  if (!GEMINI_KEY) return json({ error: 'unavailable' }, 503);

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429);

  let question = '';
  try {
    const body = await request.json();
    question = String(body?.question ?? '').trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!question) return json({ error: 'empty' }, 400);
  if (question.length > MAX_Q) question = question.slice(0, MAX_Q);

  try {
    const corpus = await buildCorpus();
    const top = retrieve(question, corpus, 5);
    const context =
      top.length > 0
        ? top.map((c, i) => `[${i + 1}] ${c.title} (${c.source})\n${c.text}`).join('\n\n')
        : '(no closely matching public content found)';

    const answer = await callGemini(question, context);
    const sources = top.map((c) => ({ title: c.title, source: c.source }));
    return json({ answer, sources });
  } catch (err) {
    console.error('[ask] error:', err);
    return json({ error: 'upstream', answer: "Sorry — I couldn't answer just now. Please try again, or use our contact form." }, 502);
  }
};

// Reject non-POST politely.
export const GET: APIRoute = () => json({ error: 'method_not_allowed' }, 405);
