// 21st.dev / Magic "Aurora Hero" — re-skinned to a molten COAL · EMBER theme
// (per ui-ux-pro-max's Luxury/Premium + Modern Dark Cinema direction): warm
// coal-black with a slow ember gradient, per-letter blur-up title, glowing CTAs.
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  emberWords?: number; // last N words rendered in ember gradient
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}

export default function AuroraHero({ eyebrow, title, emberWords = 0, description, primary, secondary, className }: Props) {
  const words = title.split(' ');
  const emberFrom = words.length - emberWords;
  return (
    <section className={cn('relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background', className)} aria-label="Hero">
      {/* molten ember aura */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute inset-[-120%]"
          style={{
            background:
              'repeating-linear-gradient(100deg, #1a0f06 8%, #b9601a 14%, #f0a43a 19%, #7a3d10 24%, #1a0f06 30%)',
            backgroundSize: '300% 100%',
            filter: 'blur(110px)',
            opacity: 0.55,
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        />
        {/* embers */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(40% 35% at 50% 8%, rgba(240,164,58,.18), transparent 70%)',
        }} />
      </div>

      {/* fine grid + vignette (coal texture) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 60% 55% at 50% 40%, black 25%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 40%, black 25%, transparent 80%)',
      }} />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(7,5,3,.9) 100%)' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary))]" />
            {eyebrow}
          </motion.span>
        )}

        <h1 className="font-[var(--font-display)] text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl md:text-[5rem]">
          {words.map((word, wi) => {
            const ember = wi >= emberFrom && emberWords > 0;
            return (
              <span key={wi} className="mr-3 inline-block last:mr-0">
                {word.split('').map((ch, ci) => (
                  <motion.span
                    key={`${wi}-${ci}`}
                    initial={{ y: 96, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: wi * 0.07 + ci * 0.022, type: 'spring', stiffness: 110, damping: 16 }}
                    className={cn(
                      'inline-block bg-clip-text text-transparent',
                      ember
                        ? 'bg-[linear-gradient(180deg,#ffd089,#f0a43a_55%,#b9601a)]'
                        : 'bg-gradient-to-br from-foreground via-foreground to-foreground/55'
                    )}
                    style={ember ? { textShadow: '0 0 30px rgba(240,164,58,.4)' } : undefined}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            );
          })}
        </h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5 }}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            {description}
          </motion.p>
        )}

        {(primary || secondary) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {primary && (
              <a href={primary.href} className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_45px_-6px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:scale-[1.03]">
                {primary.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}
            {secondary && (
              <a href={secondary.href} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors duration-300 hover:border-primary hover:text-primary">
                {secondary.label}
              </a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
