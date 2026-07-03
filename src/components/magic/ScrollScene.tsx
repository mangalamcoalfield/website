// ScrollScene — a scroll-scrubbed, pinned narrative: as you scroll through a
// tall container, a coal-seam cross-section builds up (shafts → galleries →
// winning coal → methane capture) driven by scroll progress. framer-motion
// useScroll/useTransform. Respects prefers-reduced-motion (steps still readable).
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const steps = [
  { k: 'The seam', d: 'Coal sits in seams underground, laid down over millions of years beneath the Amlabad block.' },
  { k: 'Development', d: 'Roadways and galleries are driven into the seam — the bord & pillar method that opens up the coal.' },
  { k: 'Winning coal', d: 'Coal is won shift by shift, with pillars left in place to hold the roof and keep the ground stable.' },
  { k: 'Methane, captured', d: 'The methane held within the same seam is captured as a cleaner energy stream — coal bed methane.' },
];

export default function ScrollScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.72 ? 2 : 3));

  // Inject the methane-rise keyframes once (avoids SSR/CSR text mismatch).
  useEffect(() => {
    const id = 'ss-rise-anim';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = '@keyframes ssRise{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-6px);opacity:1}}';
    document.head.appendChild(s);
  }, []);

  const shaftScale = useTransform(scrollYProgress, [0.03, 0.26], [0, 1], { clamp: true });
  const galleryOp = useTransform(scrollYProgress, [0.28, 0.5], [0, 1], { clamp: true });
  const extractOp = useTransform(scrollYProgress, [0.5, 0.72], [0, 1], { clamp: true });
  const methaneOp = useTransform(scrollYProgress, [0.72, 0.9], [0, 1], { clamp: true });
  const methaneY = useTransform(scrollYProgress, [0.72, 1], [0, -22]);

  const cells = [34, 42, 50, 58, 66];

  return (
    <section ref={ref} className="relative h-[320vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          {/* narrative */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">How coal is won</span>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">From seam to surface.</h2>
            <div className="mt-9 flex flex-col gap-3">
              {steps.map((s, i) => (
                <div key={s.k} className={`rounded-2xl border p-5 transition-all duration-500 ${i === step ? 'border-primary/40 bg-primary/[0.06]' : 'border-white/8 bg-white/[0.02] opacity-45'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex size-7 items-center justify-center rounded-lg font-[var(--font-display)] text-sm font-bold ${i === step ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-muted-foreground'}`}>{i + 1}</span>
                    <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground">{s.k}</h3>
                  </div>
                  <p className={`mt-2 text-sm leading-relaxed text-muted-foreground transition-all duration-500 ${i === step ? 'max-h-24 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* stage */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-4">
              <svg viewBox="0 0 100 80" className="h-auto w-full" role="img" aria-label="Coal seam cross-section">
                <defs>
                  <linearGradient id="ss-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1510" /><stop offset="1" stopColor="#0b1d14" /></linearGradient>
                  <linearGradient id="ss-seam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a3a26" /><stop offset="1" stopColor="#10241a" /></linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="80" fill="url(#ss-ground)" />
                <path d="M0 14 Q25 11 50 14 T100 14" stroke="rgba(255,255,255,.05)" strokeWidth="0.4" fill="none" />
                <path d="M0 26 Q25 23 50 26 T100 26" stroke="rgba(255,255,255,.05)" strokeWidth="0.4" fill="none" />
                <rect x="0" y="40" width="100" height="13" fill="url(#ss-seam)" />
                <path d="M0 40 Q25 37 50 40 T100 40" stroke="rgba(174,207,62,.35)" strokeWidth="0.5" fill="none" />

                {/* shafts (grow down) */}
                <motion.g style={{ scaleY: shaftScale, transformOrigin: 'top', transformBox: 'fill-box' } as React.CSSProperties}>
                  <rect x="29.4" y="8" width="1.2" height="32" fill="#aecf3e" />
                  <rect x="69.4" y="8" width="1.2" height="32" fill="#aecf3e" />
                  <circle cx="30" cy="8" r="2" fill="#aecf3e" />
                  <circle cx="70" cy="8" r="2" fill="#aecf3e" />
                </motion.g>

                {/* galleries — bord & pillar grid inside the seam */}
                <motion.g style={{ opacity: galleryOp }} stroke="rgba(174,207,62,.5)" strokeWidth="0.4">
                  <line x1="12" y1="46.5" x2="88" y2="46.5" />
                  {[20, 30, 40, 50, 60, 70, 80].map((x) => (<line key={x} x1={x} y1="41" x2={x} y2="52" />))}
                </motion.g>

                {/* winning coal — pillars extracted (cells glow) */}
                <motion.g style={{ opacity: extractOp }}>
                  {cells.map((x) => (<rect key={x} x={x} y="41.5" width="6" height="10" rx="0.6" fill="rgba(174,207,62,.28)" />))}
                </motion.g>

                {/* methane rising */}
                <motion.g style={{ opacity: methaneOp, y: methaneY }}>
                  {[26, 38, 50, 62, 74].map((x, i) => (
                    <circle key={x} cx={x} cy={38} r="1.1" fill="#bcd25f" style={{ animation: `ssRise 2.4s ${i * 0.3}s ease-in-out infinite` }} />
                  ))}
                </motion.g>
              </svg>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">Scroll to follow coal from seam to surface — and the methane within it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
