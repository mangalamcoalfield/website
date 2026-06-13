// Reusable entrance-animation primitive sourced from the 21st.dev / Magic
// registry (component "Hero Section 1"). Wraps children in a framer-motion
// stagger. Used by the Magic-generated showcase components on /magic-preview.
import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';

type PresetType = 'fade' | 'slide' | 'scale' | 'blur' | 'blur-slide';

interface AnimatedGroupProps {
  children: ReactNode;
  className?: string;
  variants?: { container?: Variants; item?: Variants };
  preset?: PresetType;
}

const defaultContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const defaultItem: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

const presets: Record<PresetType, { container: Variants; item: Variants }> = {
  fade: { container: defaultContainer, item: defaultItem },
  slide: {
    container: defaultContainer,
    item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  },
  scale: {
    container: defaultContainer,
    item: { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  },
  blur: {
    container: defaultContainer,
    item: { hidden: { opacity: 0, filter: 'blur(4px)' }, visible: { opacity: 1, filter: 'blur(0px)' } },
  },
  'blur-slide': {
    container: defaultContainer,
    item: {
      hidden: { opacity: 0, filter: 'blur(8px)', y: 16 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { type: 'spring', bounce: 0.3, duration: 1.1 } },
    },
  },
};

export function AnimatedGroup({ children, className, variants, preset = 'blur-slide' }: AnimatedGroupProps) {
  const selected = presets[preset];
  const container = variants?.container ?? selected.container;
  const item = variants?.item ?? selected.item;
  return (
    <motion.div initial="hidden" animate="visible" variants={container} className={cn(className)}>
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
