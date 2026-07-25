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
if (/EPSG|32645|UTM|utm/.test(raw)) leaks.push("CRS/UTM reference");
if (/\b4353\d\d|\b4373\d\d|\b26182\d\d|\b26203\d\d/.test(raw)) leaks.push("real-world coordinate");
if (/W-I|W-II|W-III|coking|grade/i.test(raw)) leaks.push("coal grade");
if (/BH[-_ ]?\d|collar|borehole/i.test(raw)) leaks.push("borehole reference");
if (/lease|gallery|old_working|fault/i.test(raw)) leaks.push("lease/workings/fault layer");
if (leaks.length) { console.error("✗ REFUSING: leaked ->", leaks.join(", ")); process.exit(1); }

console.log(`✓ ${path.relative(REPO, OUT)}  ${kb} KB  (${seams.length} seams, ${nx}x${ny} grid)`);
console.log(`  stripped: CRS, true origin, absolute scale, grades, collars, lease, workings, faults`);
console.log(`  kept:     relative shape + aspect, seam order/names/colours, relative thickness`);
