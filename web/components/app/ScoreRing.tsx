"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ScoreRing({ score, size = 52, delay = 0 }: { score: number; size?: number; delay?: number }) {
  const reduce = useReducedMotion();
  const stroke = size > 60 ? 6 : 4.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--teal)" : "var(--brass)";

  return (
    <div className={`ring${size > 60 ? " large" : ""}`} role="img" aria-label={`Fit score ${score} out of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <span aria-hidden="true">{score}</span>
    </div>
  );
}
