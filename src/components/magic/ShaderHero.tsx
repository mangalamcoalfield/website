// ShaderHero — a real WebGL fragment-shader background (domain-warped fbm flow
// in coal-black → forest → lime), mouse-reactive, with a per-letter animated
// title. Falls back to a CSS gradient if WebGL is unavailable. `compact` gives
// a shorter hero for interior pages. Respects prefers-reduced-motion.
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const FRAG = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float fbm(vec2 p){ float v=0.0,amp=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){ v+=amp*noise(p); p=m*p; amp*=0.5; } return v; }
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy; vec2 p=uv; p.x*=u_res.x/u_res.y;
  float t=u_time*0.05;
  vec2 q=vec2(fbm(p+vec2(0.0,t)), fbm(p+vec2(5.2,-t)));
  vec2 r=vec2(fbm(p+1.5*q+vec2(1.7,9.2)+0.10*t), fbm(p+1.5*q+vec2(8.3,2.8)-0.12*t));
  float f=fbm(p+2.0*r);
  vec3 coal=vec3(0.022,0.04,0.03);
  vec3 forest=vec3(0.05,0.16,0.10);
  vec3 lime=vec3(0.68,0.81,0.24);
  vec3 col=mix(coal,forest,clamp(f*1.4,0.0,1.0));
  col=mix(col,lime,pow(clamp(r.x*r.y*1.6,0.0,1.0),3.0)*0.55);
  // mouse glow
  vec2 m=u_mouse/u_res.xy; m.x*=u_res.x/u_res.y;
  float md=distance(vec2(uv.x*u_res.x/u_res.y,uv.y), vec2(m.x,m.y));
  col+=lime*smoothstep(0.35,0.0,md)*0.18;
  // vignette
  float vig=smoothstep(1.15,0.25,distance(uv,vec2(0.5)));
  col*=vig;
  gl_FragColor=vec4(col,1.0);
}`;
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0.0,1.0); }`;

interface Props {
  eyebrow?: string; title: string; accentWords?: number; description?: string;
  primary?: { label: string; href: string }; secondary?: { label: string; href: string };
  compact?: boolean;
}

export default function ShaderHero({ eyebrow, title, accentWords = 0, description, primary, secondary, compact }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) { setFailed(true); return; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { setFailed(true); return; }
    const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFailed(true); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res'), uTime = gl.getUniformLocation(prog, 'u_time'), uMouse = gl.getUniformLocation(prog, 'u_mouse');

    // Perf: cap DPR (lower on mobile), throttle to ~30fps, and pause the rAF
    // loop entirely when the hero is scrolled offscreen.
    let dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5);
    let raf = 0, start = 0, last = 0, onScreen = true, looping = false;
    const FRAME = 1000 / 30;
    const mouse = { x: 0, y: 0 };
    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (time: number) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x * dpr, canvas.height - mouse.y * dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const render = (ts: number) => {
      if (!start) start = ts;
      if (ts - last >= FRAME) { last = ts; draw((ts - start) / 1000); }
      if (onScreen && !reduced) raf = requestAnimationFrame(render); else looping = false;
    };
    const startLoop = () => { if (looping || reduced) return; looping = true; raf = requestAnimationFrame(render); };
    const onMove = (e: PointerEvent) => { const r = wrap.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };

    resize();
    if (reduced) { start = 0; draw(6); } else startLoop();
    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(6); });
    ro.observe(wrap);
    const io = new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; if (onScreen) startLoop(); }, { threshold: 0 });
    io.observe(wrap);
    wrap.addEventListener('pointermove', onMove);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); wrap.removeEventListener('pointermove', onMove); };
  }, []);

  const words = title.split(' ');
  const accentFrom = words.length - accentWords;

  return (
    <section ref={wrapRef} className={cn('relative flex w-full items-center justify-center overflow-hidden bg-background', compact ? 'min-h-[46vh] pt-32 pb-12' : 'min-h-screen')} aria-label="Hero">
      {!failed ? (
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      ) : (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: 'radial-gradient(60% 60% at 50% 30%, rgba(21,48,31,.7), transparent 70%), radial-gradient(40% 40% at 70% 80%, rgba(174,207,62,.12), transparent 70%), #06100b' }} />
      )}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(3,8,5,.78) 100%)' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {eyebrow && (
          <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary))]" />{eyebrow}
          </motion.span>
        )}
        <h1 className={cn('font-[var(--font-display)] font-bold leading-[1.03] tracking-tight', compact ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-5xl sm:text-6xl md:text-[5rem]')}>
          {words.map((word, wi) => {
            const accent = wi >= accentFrom && accentWords > 0;
            return (
              <span key={wi} className="mr-3 inline-block last:mr-0">
                {word.split('').map((ch, ci) => (
                  <motion.span key={`${wi}-${ci}`} initial={{ y: 90, opacity: 0, filter: 'blur(10px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: wi * 0.06 + ci * 0.02, type: 'spring', stiffness: 110, damping: 16 }}
                    className={cn('inline-block bg-clip-text text-transparent', accent ? 'bg-[linear-gradient(180deg,#d6e98a,#aecf3e_55%,#5e9a89)]' : 'bg-gradient-to-br from-foreground via-foreground to-foreground/55')}
                    style={accent ? { textShadow: '0 0 34px rgba(174,207,62,.4)' } : undefined}>{ch}</motion.span>
                ))}
              </span>
            );
          })}
        </h1>
        {description && (
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5 }}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</motion.p>
        )}
        {(primary || secondary) && (
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {primary && (
              <a href={primary.href} className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_45px_-6px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:scale-[1.03]">
                {primary.label}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
            )}
            {secondary && (
              <a href={secondary.href} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors duration-300 hover:border-primary hover:text-primary">{secondary.label}</a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
