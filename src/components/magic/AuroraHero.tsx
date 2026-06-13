// Real 21st.dev / Magic "Aurora Hero" component (animated aurora gradient +
// per-letter blur-up title reveal), integrated and re-branded to the Mangalam
// palette (forest/teal/lime) + shadcn theme tokens. Renders as an Astro island.
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}

export default function AuroraHero({ eyebrow, title, description, primary, secondary, className }: Props) {
  const words = title.split(' ');
  return (
    <section
      className={cn('relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden bg-background', className)}
      aria-label="Hero"
    >
      {/* Animated aurora gradient — brand forest / teal / lime */}
      <div className="absolute inset-0 overflow-hidden opacity-50" aria-hidden="true">
        <motion.div
          className="absolute inset-[-100%]"
          style={{
            background:
              'repeating-linear-gradient(100deg, #15301f 10%, #5e9a89 15%, #aecf3e 20%, #15301f 25%, #5e9a89 30%)',
            backgroundSize: '300% 100%',
            filter: 'blur(90px)',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(2,4,3,.86) 100%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent backdrop-blur"
          >
            {eyebrow}
          </motion.span>
        )}

        <h1 className="font-[var(--font-display)] text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl md:text-7xl">
          {words.map((word, wi) => (
            <span key={wi} className="mr-3 inline-block last:mr-0">
              {word.split('').map((ch, ci) => (
                <motion.span
                  key={`${wi}-${ci}`}
                  initial={{ y: 90, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: wi * 0.08 + ci * 0.025, type: 'spring', stiffness: 110, damping: 16 }}
                  className="inline-block bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent"
                  style={{ textShadow: '0 0 24px hsl(var(--primary) / 0.25)' }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            {description}
          </motion.p>
        )}

        {(primary || secondary) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {primary && (
              <a
                href={primary.href}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)] transition-all duration-300 hover:scale-[1.03]"
              >
                {primary.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}
            {secondary && (
              <a
                href={secondary.href}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors duration-300 hover:border-primary hover:text-primary"
              >
                {secondary.label}
              </a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
