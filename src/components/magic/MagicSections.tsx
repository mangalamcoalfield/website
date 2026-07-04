// Premium supporting sections — framer-motion (Magic's motion) + ui-ux-pro-max
// glass design, green/lime on coal-black. Adds: animated count-up Stats,
// 3D-tilt business Lines, a keyword Marquee, dramatic Safety, glowing CTA.
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Flame, Mountain, ShieldCheck, ArrowRight, Check } from 'lucide-react';

/* ---------- 3D tilt on pointer ---------- */
function useTilt<T extends HTMLElement>(max = 9) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`;
      el.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
      el.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
    };
    const leave = () => { el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [max]);
  return ref;
}

/* ---------- count-up ---------- */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.5, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ---------- Marquee ---------- */
const tokens = ['Amlabad Pit No. 1', 'DGMS Compliance', 'Coal Bed Methane', 'Pit No. 2', 'Eastern Jharia', 'Bord & Pillar', 'Pit No. 3', 'Mines Act 1952', 'Ventilation Discipline', 'Pit No. 4', 'Coal Mines Regulations 2017', 'Responsible Coal'];
export function Marquee() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-background py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max gap-10 marq-track">
        {[...tokens, ...tokens].map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-[var(--font-display)] text-lg font-semibold tracking-tight text-muted-foreground">
            {t}<span className="size-1.5 rounded-full bg-primary/60" />
          </span>
        ))}
      </div>
      <style>{`.marq-track{animation:marq 38s linear infinite}@keyframes marq{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.marq-track{animation:none}}`}</style>
    </section>
  );
}

const stats = [
  { to: 4, suffix: '', label: 'Amlabad pits under revival & development' },
  { to: 200, suffix: '+', label: 'Workforce, own & contractor' },
  { to: 2, suffix: '', label: 'Commercial lines — coal & coal bed methane' },
  { to: 100, suffix: '%', label: 'DGMS statutory positions filled' },
];
export function Stats() {
  return (
    <section className="relative bg-background py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm">
            <div className="font-[var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
              <span className="bg-[linear-gradient(180deg,#d6e98a,#aecf3e)] bg-clip-text text-transparent" style={{ textShadow: '0 0 30px rgba(174,207,62,.3)' }}><Counter to={s.to} suffix={s.suffix} /></span>
            </div>
            <p className="mt-3 text-[13px] leading-snug text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const lines = [
  { tag: '01', kicker: 'Coal · Mining', icon: Mountain, title: 'Reviving the Amlabad pits', body: 'Restoring the historic underground workings — Pit No. 1, 2, 3 and 4 — across revival, development and dewatering, to power India’s industrial growth through responsible coal.' },
  { tag: '02', kicker: 'Coal Bed · Methane', icon: Flame, title: 'Energy within the seam', body: 'Commercially capturing the methane held inside the coal seams — a cleaner energy stream from the same block, put to use rather than vented to the atmosphere.' },
];
function TiltLine({ l, i }: { l: typeof lines[number]; i: number }) {
  const ref = useTilt<HTMLDivElement>(8);
  const Icon = l.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}>
      <div ref={ref} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-9 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_30px_80px_-30px_rgba(174,207,62,.25)]" style={{ transformStyle: 'preserve-3d', transition: 'transform .2s ease-out, border-color .3s, box-shadow .3s' }}>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--gx,50%) var(--gy,50%), rgba(174,207,62,.10), transparent 60%)' }} />
        <div className="flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.08]"><Icon className="size-6 text-primary" strokeWidth={1.6} /></div>
          <span className="font-[var(--font-display)] text-sm font-bold text-primary/40">{l.tag}</span>
        </div>
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{l.kicker}</div>
        <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-foreground">{l.title}</h3>
        <p className="mt-3 leading-relaxed text-muted-foreground">{l.body}</p>
      </div>
    </motion.div>
  );
}
export function Lines() {
  return (
    <section className="relative bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">What we do</span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl font-bold tracking-tight text-foreground md:text-5xl">Two operations, one operator.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">{lines.map((l, i) => <TiltLine key={l.tag} l={l} i={i} />)}</div>
      </div>
    </section>
  );
}

const checks = [
  'Qualified statutory officials across all DGMS-mandated positions',
  'Maintained statutory registers and periodic equipment testing',
  'Gas monitoring, ventilation discipline and roof-support standards',
  'Medical examinations and competency tracking for the workforce',
];
export function Safety() {
  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: 'radial-gradient(50% 50% at 72% 50%, rgba(174,207,62,.08), transparent 70%)' }} />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Safety & compliance</span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl font-bold tracking-tight text-foreground md:text-5xl">The condition for permission to operate.</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {checks.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[15px] leading-snug text-muted-foreground">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><Check className="size-4" strokeWidth={2.4} /></span>{c}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-16 text-center backdrop-blur-sm">
          <ShieldCheck className="mb-6 size-9 text-primary" strokeWidth={1.5} />
          <div className="font-[var(--font-display)] text-[5.5rem] font-bold leading-none tracking-tight text-foreground md:text-[7rem]" style={{ textShadow: '0 0 60px rgba(174,207,62,.28)' }}>Zero</div>
          <p className="mt-5 max-w-xs text-muted-foreground">compromise on the standards that keep people safe underground.</p>
        </motion.div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="relative bg-background px-6 py-24">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-b from-white/[0.05] to-white/[0.01] px-8 py-20 text-center backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-[60%] rounded-full bg-primary/20 blur-[100px]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Careers</span>
        <h2 className="mx-auto mt-4 max-w-2xl font-[var(--font-display)] text-4xl font-bold tracking-tight text-foreground md:text-5xl">Build a career in Indian coal mining.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">From mining engineers to electrical and statutory roles — join a company that runs its operations to standard.</p>
        <a href="/careers" className="group mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[0_0_45px_-6px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:scale-[1.03]">
          View open roles<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </motion.div>
    </section>
  );
}
