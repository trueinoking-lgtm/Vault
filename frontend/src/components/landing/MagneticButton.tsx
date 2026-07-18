"use client";

import type { ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

type MagneticButtonProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export default function MagneticButton({
  children,
  href,
  variant = "primary",
  className = "",
}: MagneticButtonProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 180, damping: 20 });
  const springY = useSpring(y, { stiffness: 180, damping: 20 });
  const rotateX = useTransform(springY, [-18, 18], [1.5, -1.5]);
  const rotateY = useTransform(springX, [-18, 18], [-1.5, 1.5]);

  const base =
    "impact-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-page)] sm:px-7";
  const styles =
    variant === "primary"
      ? "bg-[var(--gold)] text-[var(--bg-page)] shadow-[0_16px_38px_-22px_rgba(201,162,39,0.9)]"
      : "border border-[var(--gold)] bg-transparent text-[var(--gold)] backdrop-blur-md hover:bg-[var(--gold-soft)]";

  return (
    <motion.a
      href={href}
      style={reduce ? undefined : { x: springX, y: springY, rotateX, rotateY }}
      onPointerMove={(event) => {
        if (reduce) return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.1);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.1);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </motion.a>
  );
}
