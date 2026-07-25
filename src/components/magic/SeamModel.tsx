// SeamModel — an interactive 3D view of the Amlabad seam sequence, rendered with
// raw WebGL (same approach as ShaderHero, so no 3D library is pulled in).
//
// The data behind this (src/data/seam-model.json) is deliberately NORMALISED:
// relative shape only, with the CRS, true origin, absolute scale, coal grades,
// borehole collars and lease boundaries all stripped out by tools/build_seam_model.mjs.
// It is an illustration of the geology, not a survey document — the UI says so.
//
// Vertical exaggeration is applied in the vertex shader, and each vertex carries
// the surface gradient (dzdx, dzdy) so lighting stays correct as exaggeration
// changes without rebuilding any geometry.
'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import model from '../../data/seam-model.json';

interface Seam { name: string; color: string; z: number[]; t: number[] }
const M = model as unknown as { nx: number; ny: number; ext: { x: number; y: number }; seams: Seam[] };

const VERT = `
precision highp float;
attribute vec3 a_pos;      // x, y, z(normalised)
attribute vec2 a_grad;     // dz/dx, dz/dy
attribute float a_thick;   // relative thickness
uniform mat4 u_mvp;
uniform float u_exag;
varying vec3 v_norm;
varying float v_thick;
varying float v_depth;
void main(){
  vec3 p = vec3(a_pos.xy, a_pos.z * u_exag);
  // gradient scales with exaggeration, so shading stays truthful
  v_norm = normalize(vec3(-a_grad.x * u_exag, -a_grad.y * u_exag, 1.0));
  v_thick = a_thick;
  v_depth = a_pos.z;
  gl_Position = u_mvp * vec4(p, 1.0);
}`;

const FRAG = `
precision highp float;
uniform vec3 u_color;
uniform float u_alpha;
uniform float u_iso;       // 0 = seam colour, 1 = thickness ramp
uniform float u_thickMax;
varying vec3 v_norm;
varying float v_thick;
varying float v_depth;
void main(){
  vec3 n = normalize(v_norm);
  vec3 L1 = normalize(vec3(0.45, 0.5, 0.85));
  vec3 L2 = normalize(vec3(-0.6, -0.3, 0.4));
  float d = max(dot(n, L1), 0.0) * 0.85 + max(dot(n, L2), 0.0) * 0.25 + 0.30;
  vec3 base = u_color;
  if (u_iso > 0.5) {
    float f = clamp(v_thick / max(u_thickMax, 1e-6), 0.0, 1.0);
    vec3 lo = vec3(0.05, 0.16, 0.11);
    vec3 mid = vec3(0.32, 0.55, 0.22);
    vec3 hi = vec3(0.80, 0.90, 0.36);
    base = f < 0.5 ? mix(lo, mid, f * 2.0) : mix(mid, hi, (f - 0.5) * 2.0);
  }
  gl_FragColor = vec4(base * d, u_alpha);
}`;

// --- tiny mat4 helpers (avoids a matrix dependency) ------------------------
type M4 = Float32Array;
// a·b in column-major (WebGL) order: element [col][row] lives at m[col*4+row].
const mul = (a: M4, b: M4): M4 => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
};
const perspective = (fovy: number, aspect: number, near: number, far: number): M4 => {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
};
const lookAt = (eye: number[], ctr: number[], up: number[]): M4 => {
  const z = [eye[0] - ctr[0], eye[1] - ctr[1], eye[2] - ctr[2]];
  let l = Math.hypot(z[0], z[1], z[2]); z[0] /= l; z[1] /= l; z[2] /= l;
  const x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]];
  l = Math.hypot(x[0], x[1], x[2]) || 1; x[0] /= l; x[1] /= l; x[2] /= l;
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return new Float32Array([
    x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1,
  ]);
};
const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export default function SeamModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [solo, setSolo] = useState<number | null>(null);
  const [exag, setExag] = useState(2.2);
  const [iso, setIso] = useState(false);
  // refs so the render loop reads live values without re-initialising WebGL
  const st = useRef({ solo: null as number | null, exag: 2.2, iso: false, az: -0.65, el: 0.46, dist: 1.85 });
  useEffect(() => { st.current.solo = solo; }, [solo]);
  useEffect(() => { st.current.exag = exag; }, [exag]);
  useEffect(() => { st.current.iso = iso; }, [iso]);

  const thickMax = useMemo(() => M.seams.reduce((m, s) => Math.max(m, ...s.t), 0), []);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const gl = (canvas.getContext('webgl', { antialias: true, alpha: true }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) { setFailed(true); return; }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch { setFailed(true); return; }
    gl.useProgram(prog);

    // ---- build one interleaved buffer per seam ----------------------------
    const { nx, ny, ext, seams } = M;
    const meshes = seams.map((s) => {
      const verts = new Float32Array(nx * ny * 6);
      const at = (i: number, j: number) => s.z[j * nx + i];
      const dx = (2 * ext.x) / (nx - 1), dy = (2 * ext.y) / (ny - 1);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const k = (j * nx + i) * 6;
          verts[k] = -ext.x + i * dx;
          verts[k + 1] = -ext.y + j * dy;
          verts[k + 2] = at(i, j);
          // central differences, clamped at the edges
          const zl = at(Math.max(i - 1, 0), j), zr = at(Math.min(i + 1, nx - 1), j);
          const zd = at(i, Math.max(j - 1, 0)), zu = at(i, Math.min(j + 1, ny - 1));
          verts[k + 3] = (zr - zl) / (dx * (i === 0 || i === nx - 1 ? 1 : 2));
          verts[k + 4] = (zu - zd) / (dy * (j === 0 || j === ny - 1 ? 1 : 2));
          verts[k + 5] = s.t[j * nx + i];
        }
      }
      const idx = new Uint16Array((nx - 1) * (ny - 1) * 6);
      let p = 0;
      for (let j = 0; j < ny - 1; j++)
        for (let i = 0; i < nx - 1; i++) {
          const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
          idx[p++] = a; idx[p++] = b; idx[p++] = c;
          idx[p++] = b; idx[p++] = d; idx[p++] = c;
        }
      const vb = gl.createBuffer()!, ib = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      return { vb, ib, count: idx.length, color: hex(s.color) };
    });

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const aGrad = gl.getAttribLocation(prog, 'a_grad');
    const aThick = gl.getAttribLocation(prog, 'a_thick');
    const uMvp = gl.getUniformLocation(prog, 'u_mvp');
    const uColor = gl.getUniformLocation(prog, 'u_color');
    const uAlpha = gl.getUniformLocation(prog, 'u_alpha');
    const uExag = gl.getUniformLocation(prog, 'u_exag');
    const uIso = gl.getUniformLocation(prog, 'u_iso');
    const uThickMax = gl.getUniformLocation(prog, 'u_thickMax');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ---- interaction -----------------------------------------------------
    let drag = false, lx = 0, ly = 0;
    const down = (x: number, y: number) => { drag = true; lx = x; ly = y; };
    const move = (x: number, y: number) => {
      if (!drag) return;
      st.current.az += (x - lx) * 0.008;
      st.current.el = Math.max(-0.15, Math.min(1.35, st.current.el + (y - ly) * 0.006));
      lx = x; ly = y;
    };
    const up = () => { drag = false; };
    const onMD = (e: MouseEvent) => down(e.clientX, e.clientY);
    const onMM = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTS = (e: TouchEvent) => { if (e.touches[0]) down(e.touches[0].clientX, e.touches[0].clientY); };
    const onTM = (e: TouchEvent) => {
      if (!drag || !e.touches[0]) return;
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      st.current.dist = Math.max(1.25, Math.min(4.5, st.current.dist + e.deltaY * 0.0016));
    };
    canvas.addEventListener('mousedown', onMD);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', onTS, { passive: true });
    canvas.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend', up);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // ---- loop ------------------------------------------------------------
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.01 });
    io.observe(wrap);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const s = st.current;
      if (!drag && !reduced && s.solo === null) s.az += 0.0013; // slow idle turn
      const d = s.dist;
      const eye = [
        Math.cos(s.el) * Math.sin(s.az) * d,
        -Math.cos(s.el) * Math.cos(s.az) * d,
        Math.sin(s.el) * d + 0.12,
      ];
      const mvp = mul(perspective(0.85, w / Math.max(h, 1), 0.05, 20), lookAt(eye, [0, 0, 0], [0, 0, 1]));
      gl.uniformMatrix4fv(uMvp, false, mvp);
      gl.uniform1f(uExag, s.exag);
      gl.uniform1f(uIso, s.iso ? 1 : 0);
      gl.uniform1f(uThickMax, thickMax);

      meshes.forEach((m, i) => {
        const dim = s.solo !== null && s.solo !== i;
        if (dim && s.solo !== null) return; // solo hides the rest entirely
        gl.bindBuffer(gl.ARRAY_BUFFER, m.vb);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(aGrad);
        gl.vertexAttribPointer(aGrad, 2, gl.FLOAT, false, 24, 12);
        gl.enableVertexAttribArray(aThick);
        gl.vertexAttribPointer(aThick, 1, gl.FLOAT, false, 24, 20);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib);
        gl.uniform3fv(uColor, m.color);
        gl.uniform1f(uAlpha, s.solo !== null ? 1.0 : 0.93);
        gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
      });
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener('mousedown', onMD);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', up);
      canvas.removeEventListener('touchstart', onTS);
      canvas.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend', up);
      canvas.removeEventListener('wheel', onWheel);
      meshes.forEach((m) => { gl.deleteBuffer(m.vb); gl.deleteBuffer(m.ib); });
      gl.deleteProgram(prog);
    };
  }, [thickMax]);

  if (failed) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-muted-foreground">
        This 3D view needs WebGL, which this browser doesn’t support. The seam sequence at Amlabad runs from
        Seam IV at depth up to Seam XVIII near the surface — nineteen workable horizons in all.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d120e] to-[#080a08]">
      <div ref={wrapRef} className="relative h-[380px] w-full cursor-grab active:cursor-grabbing md:h-[520px]">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-label="Interactive 3D model of the Amlabad seam sequence" />
        <div className="pointer-events-none absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
          Amlabad seam sequence
        </div>
        <div className="pointer-events-none absolute bottom-3 right-4 text-[11px] text-muted-foreground/60">
          drag to rotate · scroll to zoom
        </div>
      </div>

      {/* controls */}
      <div className="border-t border-white/10 bg-black/30 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="whitespace-nowrap font-semibold uppercase tracking-wide">Vertical exaggeration</span>
            <input type="range" min={1} max={6} step={0.1} value={exag}
              onChange={(e) => setExag(parseFloat(e.currentTarget.value))}
              className="h-1 w-28 cursor-pointer accent-[#9cc24e] md:w-40" />
            <span className="w-8 tabular-nums text-foreground/80">{exag.toFixed(1)}×</span>
          </label>
          <button onClick={() => setIso((v) => !v)}
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${iso ? 'border-primary bg-primary/15 text-primary' : 'border-white/15 text-muted-foreground hover:border-primary/40'}`}>
            Thickness shading
          </button>
          {solo !== null && (
            <button onClick={() => setSolo(null)}
              className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-semibold text-muted-foreground hover:border-primary/40">
              Show all seams
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {M.seams.map((s, i) => (
            <button key={s.name} onClick={() => setSolo(solo === i ? null : i)}
              title={`Isolate seam ${s.name}`}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${solo === i ? 'bg-primary/20 text-primary ring-1 ring-primary/40' : 'text-muted-foreground/80 hover:bg-white/[0.06]'}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/60">
          An illustration of the seam sequence, built from our own geological model of the block. Shown as
          relative geometry only — deliberately not to scale, and carrying no depths, grades, coordinates or
          borehole positions. Not a survey document.
        </p>
      </div>
    </div>
  );
}
