// Magic-generated hero, themed to the Mangalam Coalfield brand palette and
// rendered as an Astro React island on /magic-preview. Built on the 21st.dev
// AnimatedGroup motion primitive + lucide-react icons + Tailwind v4.
import { ArrowRight, ChevronRight } from 'lucide-react';
import { AnimatedGroup } from './animated-group';

export default function MagicHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#000] px-6 pt-40 pb-28 text-[#e9eae4]">
      {/* soft forest radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(48% 60% at 78% 25%, rgba(21,48,31,.6), transparent 70%), radial-gradient(40% 50% at 5% 100%, rgba(94,154,137,.08), transparent 70%), #000',
        }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <AnimatedGroup preset="blur-slide">
          <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5e9a89]">
            <ChevronRight className="size-3.5 text-[#aecf3e]" />
            Mine Developer &amp; Operator · Amlabad, Eastern Jharia
          </span>

          <h1 className="mt-8 text-balance font-[var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-[#f5f5f1] sm:text-6xl md:text-7xl">
            Reviving underground coal — and the{' '}
            <span className="relative whitespace-nowrap text-[#aecf3e]">
              methane
              <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded bg-[#aecf3e]" />
            </span>{' '}
            within it.
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-balance text-lg leading-relaxed text-[#8d938b]">
            Reviving the historic Amlabad pits in Eastern Jharia, Jharkhand — coal
            and coal bed methane, run with safety, statutory compliance and
            engineering rigour on every shift.
          </p>
        </AnimatedGroup>

        <AnimatedGroup
          preset="blur-slide"
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={{ container: { visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } } }}
        >
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-lg bg-[#aecf3e] px-6 py-3 text-sm font-semibold text-[#10130d] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#bcd25f]"
          >
            Explore our operations
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#e9eae4] transition-colors hover:text-[#aecf3e]"
          >
            How coal mining works
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </AnimatedGroup>
      </div>
    </section>
  );
}
