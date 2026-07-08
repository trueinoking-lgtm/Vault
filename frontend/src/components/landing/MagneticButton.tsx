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
  const rotateX = useTransform(springY, [-18, 18], [3, -3]);
  const rotateY = useTransform(springX, [-18, 18], [-3, 3]);

  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-300 sm:px-7";
  const styles =
    variant === "primary"
      ? "bg-cyan-300 text-slate-950 shadow-[0_0_40px_-18px_rgba(0,229,255,0.85)] hover:bg-cyan-200"
      : "border border-white/15 bg-white/[0.03] text-slate-100 backdrop-blur-md hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]";

  return (
    <motion.a
      href={href}
      style={reduce ? undefined : { x: springX, y: springY, rotateX, rotateY }}
      onPointerMove={(event) => {
        if (reduce) return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.22);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.22);
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
