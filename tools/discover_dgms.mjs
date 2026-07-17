#!/usr/bin/env node
/**
 * Discover NEW DGMS documents that aren't in our catalogue yet.
 *
 * WHY THIS EXISTS
 * ---------------
 * `Mining Regulation/tools/download_archive.ps1` only re-downloads a FIXED list of
 * filenames (`tools/_dgms_dl.csv`). It cannot find anything new, which is how the
 * catalogue silently drifted ~3 months behind (audit, 17 Jul 2026). This script
 * crawls the live DGMS listing pages and diffs them against
 * `src/data/regulations-full-seed.json`, so "what's new?" is one command.
 *
 *   node tools/discover_dgms.mjs           # human-readable report
 *   node tools/discover_dgms.mjs --json    # machine-readable
 *
 * NOTE: DGMS's own listing labels are UNRELIABLE — several files are mislabelled
 * (e.g. a file listed as the "Inspector-cum-Facilitator" notification is really
 * G.S.R. 604(E) on medical-exam notices). ALWAYS open the PDF and title the entry
 * from what the document itself says. The label below is only a hint.
 *
 * Sources (verified live 17 Jul 2026):
 *   mid=1648  DGMS Circulars      <- the live one
 *   mid=1655  Gazette Notifications
 *   mid=1603  Notifications (mostly admin/exam)
 * Do NOT use mid=1313 — it is stale (nothing after 2024).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED = path.join(REPO, "src/data/regulations-full-seed.json");
const BASE = "https://www.dgms.gov.in";

const PAGES = [
  { mid: 1648, label: "DGMS Circulars" },
  { mid: 1655, label: "Gazette Notifications" },
  { mid: 1603, label: "Notifications" },
];

const asJson = process.argv.includes("--json");

async function getHtml(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (Amlabad compliance corpus; mangalamcoalfield@gmail.com)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.text();
}

/**
 * Narrow to the page's real content. The DGMS left-hand nav repeats the same
 * ~15 principal-legislation PDFs (Mines Act, CMR 2017, …) on every page; without
 * this the diff reports them forever as "new".
 */
function contentArea(html) {
  const start = html.indexOf("divmaincontent");
  if (start === -1) return html;
  const rest = html.slice(start);
  const end = rest.search(/<footer|divfooter|id=["']footer/i);
  return end === -1 ? rest : rest.slice(0, end);
}

/** Pull every PDF link + its anchor text out of a listing page. */
function extractPdfLinks(html) {
  html = contentArea(html);
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = new URL(m[1].replace(/&amp;/g, "&"), BASE).href;
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    out.push({ href, text, file: decodeURIComponent(href.split("/").pop()) });
  }
  return out;
}

const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
// Files we've consciously decided not to catalogue (with reasons) — keeps the
// report to genuine novelties instead of the same 30 known exclusions forever.
const ignore = JSON.parse(fs.readFileSync(path.join(REPO, "tools/dgms_ignore.json"), "utf8"));
const ignored = new Map(ignore.ignore.map((i) => [i.file.toLowerCase(), i.reason]));
// Match on the DGMS filename — the stable key. source_filename is often renamed
// locally, so compare against the tail of source_url too.
const known = new Set();
for (const r of seed) {
  if (r.source_filename) known.add(r.source_filename.toLowerCase());
  if (r.source_url) known.add(decodeURIComponent(r.source_url.split("/").pop() || "").toLowerCase());
}

const found = [];
const skipped = [];
const errors = [];
for (const p of PAGES) {
  const url = `${BASE}/UserView/index?mid=${p.mid}`;
  try {
    const links = extractPdfLinks(await getHtml(url));
    for (const l of links) {
      if (known.has(l.file.toLowerCase())) continue;
      if (ignored.has(l.file.toLowerCase())) { skipped.push({ file: l.file, reason: ignored.get(l.file.toLowerCase()) }); continue; }
      // ignore obvious non-regulatory chrome (nav/static pages repeated site-wide)
      if (/^(HISTORY|VISIONMISSION|ROLEANDFUNCTIONS|STATUTORYFRAMEWORK|JURISDICTIONOFZONESANDREGIONS|DGMS_ISO)\.pdf$/i.test(l.file)) continue;
      found.push({ page: p.label, mid: p.mid, ...l });
    }
  } catch (e) {
    errors.push(`${p.label} (mid=${p.mid}): ${e.message}`);
  }
}

// de-dup by file across pages
const seen = new Set();
const news = found.filter((f) => (seen.has(f.file) ? false : seen.add(f.file)));

if (asJson) {
  console.log(JSON.stringify({ new: news, skipped, errors, knownCount: known.size }, null, 2));
} else {
  console.log(`\nDGMS discovery — catalogue holds ${seed.length} entries`);
  console.log(`(${skipped.length} listed file(s) skipped by tools/dgms_ignore.json — deliberate exclusions)`);
  console.log("=".repeat(72));
  if (errors.length) console.log("⚠ page errors:\n  " + errors.join("\n  ") + "\n");
  if (!news.length) {
    console.log("✓ Nothing new. Catalogue is up to date with the DGMS listings.\n");
  } else {
    console.log(`${news.length} document(s) on DGMS that we do NOT have:\n`);
    for (const n of news) {
      console.log(`  [${n.page}]`);
      console.log(`    label : ${n.text.slice(0, 110) || "(no text)"}`);
      console.log(`    file  : ${n.file}`);
      console.log(`    url   : ${n.href}\n`);
    }
    console.log("Next: open each PDF and title it from the DOCUMENT, not the label above.");
    console.log("Then add to src/data/regulations-full-seed.json and upload via tools/upload_regs.mjs.\n");
  }
}
process.exit(0);
