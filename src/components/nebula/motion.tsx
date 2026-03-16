"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  type Variants,
} from "framer-motion";

// ---- Easing ----

/** Smooth deceleration curve used across the system */
export const ease = [0.22, 1, 0.36, 1] as const;

// ---- Animation Variants ----

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease },
  },
};

/** Overlay backdrop fade */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Modal / panel scale-in with exit */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease },
  },
};

/** Slide-in panel from right */
export const panelSlideRight: Variants = {
  hidden: { opacity: 0, x: '100%' },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease },
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.2, ease },
  },
};

// ---- Pre-configured Motion Components ----

/** Fade-in wrapper — animates children on mount */
export function MotionFadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ duration: 0.35, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children animate in one by one */
export function MotionStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger item — use inside MotionStagger */
export function MotionStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Page-level transition wrapper — use in PageWrapper */
export function MotionPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---- Animated Counter ----

/**
 * Animates a number from 0 to `value` when it enters the viewport.
 * Supports integers, decimals, and formatted strings (e.g. "$1,234").
 */
export function AnimatedCounter({
  value,
  duration = 0.8,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
    // Add commas for thousands
    const parts = n.split('.');
    parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${prefix}${parts.join('.')}${suffix}`;
  });
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    if (inView) {
      animate(motionVal, value, {
        duration,
        ease: [0.22, 1, 0.36, 1],
      });
    }
  }, [inView, value, duration, motionVal]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

// ---- Button press micro-interaction ----

/** Wraps a button/element with subtle press (scale) and hover lift */
export function MotionPress({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'button';
}) {
  const Component = as === 'button' ? motion.button : motion.div;
  return (
    <Component
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease }}
      className={className}
    >
      {children}
    </Component>
  );
}

// Re-export motion primitives for direct use
export { motion, AnimatePresence, useInView, type Variants };
