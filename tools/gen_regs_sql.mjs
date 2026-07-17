#!/usr/bin/env node
/**
 * Regenerate the regulation SQL from the source of truth.
 *
 *   node tools/gen_regs_sql.mjs
 *
 * Writes:
 *   supabase/regulations_full_seed.sql      <- from src/data/regulations-full-seed.json
 *   supabase/regulations_download_urls.sql  <- from the live DB (download_url + file_size_kb)
 *
 * WHY THIS EXISTS
 * ---------------
 * The runbook said "regenerate regulations_full_seed.sql", but nothing generated it,
 * so it was maintained by hand and silently drifted: after the Jul-2026 refresh the
 * JSON had 467 entries while the SQL still had the old mis-titled "Circular 26 of
 * 2026" row and none of the 16 new documents. Re-seeding from it would have QUIETLY
 * REVERTED the fixes. Never hand-edit the .sql files — edit the JSON and run this.
 *
 * Note: the seed is an UPSERT, not a sync. Deleting an entry from the JSON does not
 * delete the row from the DB — do that explicitly (see regulations_july2026_update.sql).
 *
 * --check exits 1 if the generated output differs from what's on disk (CI-friendly).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_JSON = path.join(REPO, "src/data/regulations-full-seed.json");
const SEED_SQL = path.join(REPO, "supabase/regulations_full_seed.sql");
const URLS_SQL = path.join(REPO, "supabase/regulations_download_urls.sql");
const check = process.argv.includes("--check");

const COLS = ["slug","title","category","summary","doc_number","authority","issued_date",
              "status","status_note","source_url","source_filename","relevance","sort_order",
              "published","featured"];

const q = (v) => {
  if (v === null || v === undefined || v === "") return v === "" && typeof v === "string" ? "''" : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
};

// ---------- 1. full seed ----------
const seed = JSON.parse(fs.readFileSync(SEED_JSON, "utf8"));
const seen = new Set();
for (const r of seed) {
  if (seen.has(r.slug)) throw new Error(`duplicate slug in seed json: ${r.slug}`);
  seen.add(r.slug);
}
const rows = seed.map((r) => "(" + COLS.map((c) => q(r[c])).join(",") + ")");
const updates = COLS.filter((c) => c !== "slug").map((c) => `${c}=excluded.${c}`).join(",");
const seedSql =
  `insert into public.regulations (${COLS.join(",")}) values\n` +
  rows.join(",\n") +
  `\non conflict (slug) do update set ${updates};\n`;

// ---------- 2. download urls (DB is the truth here) ----------
let urlsSql = null;
try {
  const tmp = path.join(REPO, ".tmp_urls.sql");
  fs.writeFileSync(tmp, "select slug, download_url, file_size_kb from regulations where download_url is not null order by slug;\n");
  const out = execFileSync("npx", ["supabase", "db", "query", "--linked", "-f", tmp],
    { cwd: REPO, encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  fs.unlinkSync(tmp);
  const json = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
  urlsSql = json.rows
    .map((r) => `update public.regulations set download_url=${q(r.download_url)}, file_size_kb=${r.file_size_kb ?? "null"} where slug=${q(r.slug)};`)
    .join("\n") + "\n";
  console.log(`download_urls: ${json.rows.length} rows from DB`);
} catch (e) {
  console.warn("⚠ could not reach the DB — leaving regulations_download_urls.sql untouched:", e.message.split("\n")[0]);
}

// ---------- 3. write / check ----------
let drift = false;
const put = (file, content, label) => {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (cur === content) { console.log(`✓ ${label} already up to date`); return; }
  if (check) { console.error(`✗ ${label} is STALE — run: node tools/gen_regs_sql.mjs`); drift = true; return; }
  fs.writeFileSync(file, content);
  console.log(`↻ rewrote ${label}`);
};
put(SEED_SQL, seedSql, "supabase/regulations_full_seed.sql");
if (urlsSql) put(URLS_SQL, urlsSql, "supabase/regulations_download_urls.sql");

console.log(`seed json: ${seed.length} entries`);
process.exit(drift ? 1 : 0);
