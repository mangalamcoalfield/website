// ParticleHero — interactive canvas constellation (green motes + connecting
// lines), a cursor-tracking spotlight, drifting mesh glow, and a per-letter
// blur-up title. The visual centerpiece. Respects prefers-reduced-motion.
'use client';
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  accentWords?: number; // last N words in lime gradient
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

export default function ParticleHero({ eyebrow, title, accentWords = 0, description, primary, secondary }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -999, y: -999 };

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let parts: P[] = [];

    const resize = () => {
      w = wrap.clientWidth; h = wrap.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.floor((w * h) / 14000));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(0.15 + Math.random() * 0.4),
        r: 0.7 + Math.random() * 1.8,
        a: 0.25 + Math.random() * 0.5,
      }));
    };

    const LIME = '174,207,62';
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // connecting lines
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 13000) {
            const o = (1 - d2 / 13000) * 0.16;
            ctx.strokeStyle = `rgba(${LIME},${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      // particles
      for (const p of parts) {
        // cursor attraction glow
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        const near = dist < 140 ? (1 - dist / 140) : 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${LIME},${Math.min(1, p.a + near * 0.6)})`;
        ctx.shadowColor = `rgba(${LIME},0.9)`;
        ctx.shadowBlur = 6 + near * 12;
        ctx.arc(p.x, p.y, p.r + near * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!reduced) {
          p.x += p.vx + (near ? dx * 0.0008 : 0);
          p.y += p.vy;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
      if (spotRef.current) {
        spotRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
        spotRef.current.style.opacity = '1';
      }
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; if (spotRef.current) spotRef.current.style.opacity = '0'; };

    resize(); draw();
    window.addEventListener('resize', resize);
    // Re-init when the element actually gets dimensions (robust to late layout).
    const ro = new ResizeObserver(() => { if (wrap.clientWidth && (w !== wrap.clientWidth || h !== wrap.clientHeight)) resize(); });
    ro.observe(wrap);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); ro.disconnect(); wrap.removeEventListener('pointermove', onMove); wrap.removeEventListener('pointerleave', onLeave); };
  }, []);

  const words = title.split(' ');
  const accentFrom = words.length - accentWords;

  return (
    <section ref={wrapRef} className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background" aria-label="Hero">
      {/* drifting mesh glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="hero-blob absolute left-[10%] top-[8%] h-[42vw] w-[42vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(21,48,31,.9), transparent 70%)' }} />
        <div className="hero-blob hero-blob-2 absolute right-[6%] top-[30%] h-[30vw] w-[30vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(94,154,137,.22), transparent 70%)' }} />
        <div className="hero-blob hero-blob-3 absolute bottom-[2%] left-[35%] h-[26vw] w-[26vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(174,207,62,.14), transparent 70%)' }} />
      </div>

      {/* canvas constellation */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* cursor spotlight */}
      <div ref={spotRef} className="pointer-events-none absolute left-0 top-0 -ml-[300px] -mt-[300px] h-[600px] w-[600px] opacity-0 transition-opacity duration-500" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(174,207,62,.10), transparent 60%)', mixBlendMode: 'screen' }} />

      {/* vignette */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(3,8,5,.85) 100%)' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {eyebrow && (
          <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary))]" />
            {eyebrow}
          </motion.span>
        )}

        <h1 className="font-[var(--font-display)] text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl md:text-[5rem]">
          {words.map((word, wi) => {
            const accent = wi >= accentFrom && accentWords > 0;
            return (
              <span key={wi} className="mr-3 inline-block last:mr-0">
                {word.split('').map((ch, ci) => (
                  <motion.span key={`${wi}-${ci}`}
                    initial={{ y: 96, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: wi * 0.07 + ci * 0.022, type: 'spring', stiffness: 110, damping: 16 }}
                    className={cn('inline-block bg-clip-text text-transparent',
                      accent ? 'bg-[linear-gradient(180deg,#d6e98a,#aecf3e_55%,#5e9a89)]' : 'bg-gradient-to-br from-foreground via-foreground to-foreground/55')}
                    style={accent ? { textShadow: '0 0 34px rgba(174,207,62,.4)' } : undefined}>
                    {ch}
                  </motion.span>
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
                {primary.label}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}
            {secondary && (
              <a href={secondary.href} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors duration-300 hover:border-primary hover:text-primary">
                {secondary.label}
              </a>
            )}
          </motion.div>
        )}

        {/* scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-16 flex justify-center">
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <motion.span className="h-2 w-1 rounded-full bg-primary" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
        </motion.div>
      </div>

      <style>{`
        .hero-blob{filter:blur(60px);will-change:transform}
        .hero-blob{animation:heroDrift 26s ease-in-out infinite alternate}
        .hero-blob-2{animation-duration:32s;animation-delay:-8s}
        .hero-blob-3{animation-duration:38s;animation-delay:-15s}
        @keyframes heroDrift{to{transform:translate3d(6%,-5%,0) scale(1.15)}}
        @media (prefers-reduced-motion:reduce){.hero-blob{animation:none}}
      `}</style>
    </section>
  );
}
