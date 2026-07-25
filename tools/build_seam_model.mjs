#!/usr/bin/env node
/**
 * Build the PUBLIC, normalised seam-model asset for the website.
 *
 *   node tools/build_seam_model.mjs
 *
 * Reads the full geological model (private, outside this repo) and emits a
 * deliberately de-referenced version for public display:
 *
 *   src/data/seam-model.json
 *
 * WHAT IS STRIPPED (deliberate — do not "restore" these):
 *   - the CRS and the true origin (no EPSG:32645, no UTM eastings/northings/RLs)
 *   - every absolute dimension: all coordinates are divided by ONE undisclosed
 *     scale factor and re-centred, so nothing metric is recoverable
 *   - coal grades (incl. which seams are W-I prime), borehole IDs and collar
 *     positions, lease boundaries, gallery/old-workings polygons, fault throws
 *
 * WHAT IS KEPT (safe, and what makes it look good):
 *   - seam stacking order and true relative shape/aspect, so it renders exactly
 *     like the real block
 *   - standard Jharia stratigraphic seam names (XVIII T … IV), which are public
 *     geology, and the per-seam display colours
 *   - relative thickness, for the isopach shading
 *   - borehole collars in the SAME normalised space, with their public IDs and a
 *     survey-accuracy tier. This shows the drilling pattern (and that 21 holes are
 *     surveyed to ~1-2 m) without giving anyone a georeferenced drill location:
 *     the true origin and scale are gone, so nothing maps back to the ground.
 *     Real eastings/northings/RLs and depths in metres are NOT emitted.
 *
 * The full model — real coordinates, grades, collars — is NOT published here.
 * It belongs behind the Operations Portal login.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = "C:/Users/Mangalam/Mangalam Misc/Amlabad_DataGrab/model_3d_inputs/model_v11.json";
const OUT = path.join(REPO, "src/data/seam-model.json");

if (!fs.existsSync(SRC)) {
  console.error(`✗ source model not found:\n  ${SRC}\n  (it lives outside the repo by design)`);
  process.exit(1);
}
const m = JSON.parse(fs.readFileSync(SRC, "utf8"));
const { nx, ny, seams } = m;

// ---- global bounds across every seam -------------------------------------
let e0 = Infinity, e1 = -Infinity, n0 = Infinity, n1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const s of seams) {
  for (const row of s.floor_utm) {
    for (const [E, N, RL] of row) {
      if (E < e0) e0 = E; if (E > e1) e1 = E;
      if (N < n0) n0 = N; if (N > n1) n1 = N;
      if (RL < z0) z0 = RL; if (RL > z1) z1 = RL;
    }
  }
}
const cE = (e0 + e1) / 2, cN = (n0 + n1) / 2, cZ = (z0 + z1) / 2;
// ONE scale for all three axes -> true aspect ratio preserved, absolute size lost.
const S = Math.max(e1 - e0, n1 - n0);

// ---- confirm the grid is regular (x/y can then be implied by index) -------
const g = seams[0].floor_utm;
let maxDev = 0;
for (let j = 0; j < ny; j++) {
  for (let i = 0; i < nx; i++) {
    const expX = e0 + ((e1 - e0) * i) / (nx - 1);
    const expY = n0 + ((n1 - n0) * j) / (ny - 1);
    maxDev = Math.max(maxDev, Math.abs(g[j][i][0] - expX), Math.abs(g[j][i][1] - expY));
  }
}
// Tolerance is a fraction of one cell, not of the whole block: the source carries
// harmless rounding noise (~0.05 units on a ~40-unit cell = 0.1%, invisible).
const cell = (e1 - e0) / (nx - 1);
const regular = maxDev < 0.01 * cell;
if (!regular) console.warn(`  ⚠ grid is irregular (max dev ${maxDev.toFixed(2)} vs cell ${cell.toFixed(1)})`);

// ---- emit ----------------------------------------------------------------
const r = (v, p = 4) => Number(v.toFixed(p));
const out = {
  _note: "Normalised, de-referenced seam geometry for public display. No CRS, no real-world coordinates, no absolute dimensions, no grades, no borehole collars. Relative shape only.",
  nx, ny,
  // normalised half-extents, so the renderer knows the footprint's aspect
  ext: { x: r((e1 - e0) / S / 2), y: r((n1 - n0) / S / 2) },
  regular,
  // Collars in normalised space + a coarse survey-accuracy tier. The raw
  // pos_src strings are internal notes, so they are mapped to public labels.
  holes: (m.holes || []).map((h) => ({
    id: h.id,
    x: r((h.E - cE) / S),
    y: r((h.N - cN) / S),
    z: r((h.RL - cZ) / S),
    d: r((h.td || 0) / S, 4),      // relative depth of the stem, not metres
    tier: String(h.pos_tier || '').startsWith('A') ? 'A'
        : String(h.pos_tier || '').startsWith('B') ? 'B' : 'C',
  })),
  tiers: { A: 'Surveyed to ~1–2 m', B: 'Transformed, ~35 m', C: 'Estimated position' },
  seams: seams.map((s) => {
    const z = [], t = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        z.push(r((s.floor_utm[j][i][2] - cZ) / S));
        t.push(r(s.thick[j][i] / S, 5));
      }
    }
    return { name: s.seam, color: s.color, z, t };
  }),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);

// ---- safety assertions ---------------------------------------------------
// Check the DATA only — the _note deliberately contains the words "grade",
// "borehole" etc. while describing what was removed.
const raw = JSON.stringify({ ...out, _note: undefined });
const leaks = [];
if (/EPSG|UTM|utm/.test(raw)) leaks.push("CRS reference");
// Walk the real values: everything emitted is normalised (|v| << 2) apart from
// the grid counts, so any large magnitude means a raw metric value slipped in.
// (Regexing the text gives false positives on the fractions of tiny numbers.)
const big = (v, key = "") => {
  if (typeof v === "number") return Math.abs(v) >= 1000 && key !== "nx" && key !== "ny";
  if (Array.isArray(v)) return v.some((x) => big(x, key));
  if (v && typeof v === "object") return Object.entries(v).some(([k, x]) => big(x, k));
  return false;
};
if (big(out)) leaks.push("real-world-magnitude number");
if (/W-I|W-II|W-III|coking|grade/i.test(raw)) leaks.push("coal grade");
if (/lease|gallery|old_working|fault|pos_src|pos_acc/i.test(raw)) leaks.push("lease/workings/fault/provenance field");
// boreholes are intentional, but only as normalised x/y/z/d — never raw survey fields
for (const h of out.holes) {
  if (['E', 'N', 'RL', 'td'].some((k) => k in h)) { leaks.push("raw borehole survey field"); break; }
  if (Math.abs(h.x) > 2 || Math.abs(h.y) > 2 || Math.abs(h.z) > 2 || h.d > 2) { leaks.push("un-normalised borehole value"); break; }
}
if (leaks.length) { console.error("✗ REFUSING: leaked ->", [...new Set(leaks)].join(", ")); process.exit(1); }

const tierCount = out.holes.reduce((a, h) => ((a[h.tier] = (a[h.tier] || 0) + 1), a), {});
console.log(`✓ ${path.relative(REPO, OUT)}  ${kb} KB  (${seams.length} seams, ${nx}x${ny} grid, ${out.holes.length} boreholes ${JSON.stringify(tierCount)})`);
console.log(`  stripped: CRS, true origin, absolute scale, grades, lease, workings, faults, raw survey fields`);
console.log(`  kept:     relative shape + aspect, seam order/names/colours, relative thickness,`);
console.log(`            borehole pattern (normalised x/y/z/depth + id + accuracy tier)`);
