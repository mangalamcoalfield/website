// Branded adaptation of the 21st.dev / Magic "Bento" feature grid — animated
// grid + aurora background, intersection-reveal cards, gently animated icons,
// hover glow. Re-themed to Mangalam (forest/lime/teal) via shadcn tokens.
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Pickaxe, HardHat, Wrench, ShieldCheck } from 'lucide-react';

const features = [
  { title: 'Mine Development', meta: '01', blurb: 'Driving and supporting underground roadways and galleries that open up the coal seam for production.', icon: Pickaxe, span: 'md:col-span-4 md:row-span-2', anim: 'mb-float 7s ease-in-out infinite' },
  { title: 'Underground Operations', meta: '02', blurb: 'Shift-by-shift production, reconciliation and structured reporting across every working district.', icon: HardHat, span: 'md:col-span-2', anim: 'mb-pulse 5s ease-in-out infinite' },
  { title: 'Electrical & Mechanical', meta: '03', blurb: 'DGMS-approved equipment and statutory testing that keep machinery safe and certified.', icon: Wrench, span: 'md:col-span-2', anim: 'mb-tilt 6s ease-in-out infinite' },
  { title: 'Statutory Compliance', meta: '04', blurb: 'Operating to the Coal Mines Regulations 2017 and the Mines Act, with qualified officials in every position.', icon: ShieldCheck, span: 'md:col-span-6', anim: 'mb-drift 8s ease-in-out infinite' },
];

export default function MagicBento() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = 'magic-bento-anim';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.innerHTML = `
        @keyframes mb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6%)}}
        @keyframes mb-pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1}}
        @keyframes mb-tilt{0%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}100%{transform:rotate(-3deg)}}
        @keyframes mb-drift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(6%,-6%,0)}}
        @keyframes mb-card{0%{opacity:0;transform:translate3d(0,18px,0) scale(.96)}100%{opacity:1;transform:none}}`;
      document.head.appendChild(s);
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }), { threshold: 0.2 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background py-24 text-foreground">
      {/* animated grid + aurora background */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 90% at 15% 0%, rgba(21,48,31,.6), transparent 65%), radial-gradient(ellipse 40% 80% at 90% 10%, rgba(94,154,137,.16), transparent 70%)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 75%)',
        }} />
      </div>

      <div ref={ref} className="mx-auto max-w-6xl px-6">
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Capabilities</span>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">How we operate.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Four core capabilities run every working district to standard — a real 21st.dev Magic bento, themed to the Mangalam palette.</p>
        </header>

        <div className="grid grid-cols-1 gap-3 md:auto-rows-[minmax(130px,auto)] md:grid-cols-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 ${visible ? 'motion-safe:animate-[mb-card_.8s_ease-out_forwards]' : 'motion-safe:opacity-0'} ${f.span}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.6} style={{ animation: f.anim }} />
                  </div>
                  <div className="flex-1">
                    <header className="flex items-start gap-3">
                      <h3 className="font-[var(--font-display)] text-lg font-semibold">{f.title}</h3>
                      <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 font-[var(--font-display)] text-[11px] tracking-wider text-accent">{f.meta}</span>
                    </header>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.blurb}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
