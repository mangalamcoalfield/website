// Upload vetted regulation PDFs + the DGMS compilations to Hostinger over FTPS,
// then emit SQL that sets each regulation's download_url + file_size_kb.
//
//   npm i basic-ftp            (once)
//   node tools/upload_regs.mjs           # dry run: resolves files, no upload
//   node tools/upload_regs.mjs --go      # actually upload
//
// Reads creds from .hostinger.env (FTP_HOST/PORT/USER/PASS). Hostinger requires
// FTPS (explicit TLS). Files land in public_html/regs -> https://docs.mangalamcoal.com/regs/<slug>.pdf
import fs from "node:fs";
import path from "node:path";

const GO = process.argv.includes("--go");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const SRC_ROOTS = [
  "C:/Users/Mangalam/Mining Regulation",                 // whole tree (sources/, Labour Law/, etc.)
  "C:/Users/Mangalam/Mangalam Misc/Amlabad_DataGrab/sources", // fallback (ventilation circular)
];
const SKIP_DIRS = new Set(["_extracted", "node_modules", ".git", "tools"]);
const PUBLIC_BASE = "https://docs.mangalamcoal.com/regs";

function env() {
  const t = fs.readFileSync(path.join(REPO, ".hostinger.env"), "utf8");
  const o = {};
  for (const line of t.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m) o[m[1]] = m[2];
  }
  return o;
}

function indexPdfs() {
  const idx = new Map();
  const walk = (d) => {
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); }
      else if (e.name.toLowerCase().endsWith(".pdf") && !idx.has(e.name)) idx.set(e.name, p);
    }
  };
  for (const r of SRC_ROOTS) walk(r);
  return idx;
}

const seed = JSON.parse(fs.readFileSync(path.join(REPO, "src/data/regulations-full-seed.json"), "utf8"));
const circ = JSON.parse(fs.readFileSync(path.join(REPO, "src/data/circular-index.json"), "utf8"));
const idx = indexPdfs();

// jobs: { local, remoteName, slug|null }
const jobs = [];
const sqlRows = [];
let missing = 0;
for (const e of seed) {
  const base = e.source_filename ? path.basename(e.source_filename) : null;
  const local = base ? idx.get(base) : null;
  if (!local) { missing++; console.warn("MISSING:", e.slug, "<-", base); continue; }
  const remoteName = `${e.slug}.pdf`;
  const kb = Math.round(fs.statSync(local).size / 1024);
  jobs.push({ local, remoteName });
  sqlRows.push(`update public.regulations set download_url='${PUBLIC_BASE}/${remoteName}', file_size_kb=${kb} where slug='${e.slug}';`);
}
// Compilations under ORIGINAL names (Circular Finder links depend on these).
for (const name of [...new Set(circ.map((c) => c.compilation_filename))]) {
  const local = idx.get(path.basename(name));
  if (!local) { console.warn("MISSING COMPILATION:", name); continue; }
  jobs.push({ local, remoteName: name });
}

fs.writeFileSync(path.join(REPO, "supabase/regulations_download_urls.sql"), sqlRows.join("\n") + "\n");
const totalMB = (jobs.reduce((a, j) => a + fs.statSync(j.local).size, 0) / 1048576).toFixed(1);
console.log(`resolved ${jobs.length} files (${totalMB} MB), ${missing} missing. SQL rows: ${sqlRows.length}`);
console.log(`Wrote supabase/regulations_download_urls.sql`);
if (!GO) { console.log("dry run — pass --go to upload."); process.exit(0); }

const { Client } = await import("basic-ftp"); // lazy: only needed for --go
const c = env();
const client = new Client(45000);
try {
  await client.access({
    host: c.FTP_HOST, port: Number(c.FTP_PORT || 21), user: c.FTP_USER, password: c.FTP_PASS,
    secure: true, secureOptions: { rejectUnauthorized: false },
  });
  await client.ensureDir("regs"); // creates public_html/regs and cd's in
  let done = 0, skipped = 0;
  for (const j of jobs) {
    const localSize = fs.statSync(j.local).size;
    let remoteSize = -1;
    try { remoteSize = await client.size(j.remoteName); } catch {}
    if (remoteSize === localSize) { skipped++; done++; continue; }
    await client.uploadFrom(j.local, j.remoteName);
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${jobs.length} uploaded (${skipped} skipped)`);
  }
  console.log(`DONE: ${done}/${jobs.length} uploaded (${skipped} already current).`);
} finally {
  client.close();
}
