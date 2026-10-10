// Post-build guard: prove the serverless function can actually start.
//
// Why this exists: on 2026-10-10 an `npm audit fix` moved @astrojs/vercel from
// 11.0.8 to 11.0.13, whose middleware imports `rolldown`. The build passed and
// every static page deployed fine, but the traced function shipped rolldown
// without its native binary, so EVERY server route (API, admin, cron, chat)
// died on startup with "Cannot find native binding" until the lockfile was
// rolled back.
//
// Importing the entry where it was built proves nothing — Node walks up into
// the project's own node_modules and finds what the deployed function will not
// have. So the function directory is copied somewhere isolated first and its
// entry is imported there, exactly as the platform will load it. A failure
// exits non-zero, which fails the Vercel build and leaves the previous
// deployment serving.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const fnDir = path.join(root, '.vercel', 'output', 'functions');
if (!fs.existsSync(fnDir)) {
  console.log('[check_function] no serverless functions in this build — nothing to check');
  process.exit(0);
}

let failed = false;
for (const name of fs.readdirSync(fnDir).filter((d) => d.endsWith('.func'))) {
  const src = path.join(fnDir, name);
  const cfg = JSON.parse(fs.readFileSync(path.join(src, '.vc-config.json'), 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fncheck-'));
  try {
    fs.cpSync(src, tmp, { recursive: true, dereference: true });
    await import(pathToFileURL(path.join(tmp, cfg.handler)).href);
    console.log(`[check_function] ${name}: entry loads in isolation ✓`);
  } catch (e) {
    failed = true;
    console.error(`[check_function] ${name}: entry FAILED to load in isolation — this deploy would break every server route.\n  ${String(e?.message || e).split('\n')[0]}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
process.exit(failed ? 1 : 0);
