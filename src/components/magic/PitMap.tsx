// Interactive Amlabad pit map — a stylized coal-seam cross-section with four
// selectable pit shafts; hover/click reveals each pit's stage. Animated glow.
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pits = [
  { no: '1', x: 16, label: 'Pit No. 1', status: 'Revival', desc: 'Historic underground working under revival as part of the Amlabad block restoration.' },
  { no: '2', x: 38, label: 'Pit No. 2', status: 'Development', desc: 'Underground development to open up access and working districts.' },
  { no: '3', x: 60, label: 'Pit No. 3', status: 'Development', desc: 'Development of roadways and galleries through the coal seam.' },
  { no: '4', x: 82, label: 'Pit No. 4', status: 'Dewatering', desc: 'Dewatering and rehabilitation ahead of further development.' },
];

export default function PitMap() {
  const [active, setActive] = useState(0);
  const p = pits[active];
  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">The four Amlabad pits · Eastern Jharia Area, Bokaro</span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl font-bold tracking-tight text-foreground md:text-5xl">Reviving every shaft.</h2>
          <p className="mt-4 text-muted-foreground">Hover or tap a shaft to see its stage. Interactive cross-section — built with Magic motion.</p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* SVG cross-section */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-4">
            <svg viewBox="0 0 100 60" className="h-auto w-full" role="img" aria-label="Amlabad pit cross-section">
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1510" /><stop offset="1" stopColor="#0a1f15" /></linearGradient>
                <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16301f" /><stop offset="1" stopColor="#0c1a12" /></linearGradient>
              </defs>
              <rect x="0" y="0" width="100" height="24" fill="url(#sky)" />
              {/* ground strata */}
              <rect x="0" y="24" width="100" height="36" fill="url(#seam)" />
              <path d="M0 30 Q25 27 50 30 T100 30" stroke="rgba(255,255,255,.06)" strokeWidth="0.4" fill="none" />
              <path d="M0 40 Q25 37 50 40 T100 40" stroke="rgba(174,207,62,.18)" strokeWidth="0.5" fill="none" />
              <path d="M0 50 Q25 47 50 50 T100 50" stroke="rgba(255,255,255,.05)" strokeWidth="0.4" fill="none" />
              {/* shafts */}
              {pits.map((pit, i) => {
                const on = i === active;
                return (
                  <g key={pit.no} className="cursor-pointer" onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}>
                    <rect x={pit.x - 8} y="0" width="16" height="60" fill="transparent" />
                    <line x1={pit.x} y1="24" x2={pit.x} y2="50" stroke={on ? '#aecf3e' : 'rgba(255,255,255,.18)'} strokeWidth={on ? 1 : 0.6} />
                    <circle cx={pit.x} cy="24" r={on ? 2.6 : 1.8} fill={on ? '#aecf3e' : '#5e9a89'} style={on ? { filter: 'drop-shadow(0 0 3px #aecf3e)' } : undefined} />
                    <circle cx={pit.x} cy="50" r="1.2" fill={on ? '#aecf3e' : 'rgba(174,207,62,.4)'} />
                    <text x={pit.x} y="20" textAnchor="middle" fontSize="3" fill={on ? '#aecf3e' : 'rgba(233,234,228,.6)'} style={{ fontWeight: 700 }}>{pit.no}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* detail card */}
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="font-[var(--font-display)] text-5xl font-bold text-primary" style={{ textShadow: '0 0 30px rgba(174,207,62,.3)' }}>{p.no}</span>
                <div>
                  <div className="font-[var(--font-display)] text-lg font-semibold text-foreground">{p.label}</div>
                  <span className="mt-1 inline-block rounded-full bg-primary/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">{p.status}</span>
                </div>
              </div>
              <p className="mt-5 leading-relaxed text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex gap-2">
                {pits.map((pit, i) => (
                  <button key={pit.no} onClick={() => setActive(i)} aria-label={pit.label}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${i === active ? 'bg-primary' : 'bg-white/15 hover:bg-white/30'}`} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
