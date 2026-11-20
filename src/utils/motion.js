import { useEffect, useState } from 'react';
import { animate } from 'motion/react';

export const TF_EASE = [0.16, 1, 0.3, 1];

export const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: TF_EASE },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.12, ease: TF_EASE },
  },
};

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const modalPanelVariants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: TF_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.14, ease: TF_EASE },
  },
};

/**
 * Smoothly animates a numeric readout on reveal (respecting prefers-reduced-motion).
 */
export function AnimatedNumber({ value = 0, duration = 0.55, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplay(Math.round(value));
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: TF_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, duration]);

  return `${display}${suffix}`;
}
