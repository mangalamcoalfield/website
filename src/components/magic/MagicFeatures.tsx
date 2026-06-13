// Magic-style capabilities grid, themed to brand, on the 21st.dev AnimatedGroup
// primitive. Astro React island on /magic-preview.
import { Pickaxe, HardHat, Wrench, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { AnimatedGroup } from './animated-group';

const items = [
  { icon: Pickaxe, ix: '01', title: 'Mine Development', body: 'Driving and supporting underground roadways and galleries that open up the coal seam for production.' },
  { icon: HardHat, ix: '02', title: 'Underground Operations', body: 'Shift-by-shift production, reconciliation and structured reporting across every working district.' },
  { icon: Wrench, ix: '03', title: 'Electrical & Mechanical', body: 'Maintaining DGMS-approved equipment and statutory testing that keep machinery safe and certified.' },
  { icon: ShieldCheck, ix: '04', title: 'Statutory Compliance', body: 'Operating to the Coal Mines Regulations 2017 and the Mines Act, with qualified officials in every position.' },
];

export default function MagicFeatures() {
  return (
    <section className="bg-[#15301f] px-6 py-24 text-[#e9eae4]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5e9a89]">
            <span className="size-3 bg-[#aecf3e]" style={{ clipPath: 'polygon(50% 0, 100% 55%, 82% 55%, 50% 26%, 18% 55%, 0 55%)' }} />
            Capabilities
          </span>
          <h2 className="mt-4 text-balance font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[#f5f5f1] sm:text-5xl">
            How we operate.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#8d938b]">
            Four core capabilities run every working district to standard — generated as a Magic component, themed to the Mangalam palette.
          </p>
        </div>

        <AnimatedGroup
          preset="blur-slide"
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={{ container: { visible: { transition: { staggerChildren: 0.1 } } } }}
        >
          {items.map(({ icon: Icon, ix, title, body }) => (
            <div
              key={ix}
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.035] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#aecf3e]/30 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-[#aecf3e]" strokeWidth={1.6} />
                <span className="font-[var(--font-display)] text-xs font-semibold tracking-wider text-[#5e9a89]">{ix}</span>
              </div>
              <h3 className="mt-5 font-[var(--font-display)] text-lg font-semibold text-[#f5f5f1]">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#8d938b]">{body}</p>
              <ArrowUpRight className="mt-5 size-4 text-[#5e9a89] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#aecf3e] group-hover:opacity-100" />
            </div>
          ))}
        </AnimatedGroup>
      </div>
    </section>
  );
}
