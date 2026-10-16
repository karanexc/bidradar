"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ScoreRing } from "./ScoreRing";
import { formatDeadline, formatValue } from "@/lib/format";
import { STATUS_LABELS, type Match } from "@/lib/types";

export function MatchList({ matches }: { matches: Match[] }) {
  const reduce = useReducedMotion();

  return (
    <ul className="match-list">
      {matches.map((m, i) => (
        <motion.li
          key={m.id}
          initial={reduce ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i, 10) * 0.05, duration: 0.3 }}
        >
          <Link className="match-row" href={`/dashboard/tenders/${m.id}`}>
            <ScoreRing score={m.score} delay={0.15 + Math.min(i, 10) * 0.05} />
            <div>
              <h2>{m.tenders?.title ?? "Tender"}</h2>
              <div className="meta">
                <span>{m.tenders?.buyer ?? "Buyer not stated"}</span>
                <span>{formatValue(m.tenders?.value_amount ?? null, m.tenders?.currency ?? null)}</span>
                <span>{formatDeadline(m.tenders?.deadline ?? null)}</span>
              </div>
              {m.reasons?.[0] && <p className="reason">{m.reasons[0]}</p>}
            </div>
            <span className={`pill ${m.status}`}>{STATUS_LABELS[m.status]}</span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
