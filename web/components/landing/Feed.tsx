"use client";

import { motion, useReducedMotion } from "framer-motion";

type Item = { kind: "fit" | "skip"; title: string; value: string; closes: string; stamp: string; why?: string };

const ITEMS: Item[] = [
  { kind: "skip", title: "Grounds maintenance for 14 school sites", value: "£180,000", closes: "Closes 12 Nov", stamp: "Skipped" },
  {
    kind: "fit",
    title: "Website redesign and hosting for a district council",
    value: "£45,000",
    closes: "Closes 3 Nov",
    stamp: "Strong fit 91",
    why: "Matches your web design and hosting work, and the value suits your team size.",
  },
  { kind: "skip", title: "Supply of office furniture, framework agreement", value: "£2.4m", closes: "Closes 28 Oct", stamp: "Skipped" },
  {
    kind: "fit",
    title: "Accessibility audit of a university student portal",
    value: "£38,000",
    closes: "Closes 19 Nov",
    stamp: "Good fit 78",
    why: "Close to your past accessibility projects. Requires ISO 27001, which you'd need to confirm.",
  },
];

const START = 0.6;
const GAP = 0.9;

export function Feed() {
  const reduce = useReducedMotion();
  const total = START + ITEMS.length * GAP;

  return (
    <div className="feed" aria-label="Example of a BidRadar morning shortlist">
      <div className="feed-head">
        <motion.svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          aria-hidden="true"
          initial={false}
          animate={reduce ? undefined : { rotate: 360 * 3 }}
          transition={{ duration: total, ease: [0.3, 0, 0.2, 1] }}
        >
          <circle cx="22" cy="22" r="20" fill="none" stroke="var(--rule)" strokeWidth="2" />
          <circle cx="22" cy="22" r="11" fill="none" stroke="var(--rule)" strokeWidth="1.5" />
          <path d="M22 22 L22 2 A20 20 0 0 1 39.3 12 Z" fill="var(--brass)" opacity=".7" />
          <circle cx="30" cy="13" r="2.5" fill="var(--ink)" />
        </motion.svg>
        <div>
          <strong>This morning&apos;s tenders</strong>
          <span>Illustrative example for a small web agency</span>
        </div>
      </div>

      <ul>
        {ITEMS.map((item, i) => (
          <motion.li
            key={item.title}
            className={`slip ${item.kind}`}
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: START + i * GAP, duration: 0.35, ease: "easeOut" }}
          >
            <h3>{item.title}</h3>
            <div className="meta">
              <span>{item.value}</span>
              <span>{item.closes}</span>
            </div>
            <motion.span
              className="stamp"
              initial={reduce ? false : { opacity: 0, scale: 1.7, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: item.kind === "fit" ? -3 : 0 }}
              transition={{ delay: START + i * GAP + 0.45, type: "spring", stiffness: 480, damping: 17 }}
            >
              {item.stamp}
            </motion.span>
            {item.why && <p className="why">{item.why}</p>}
          </motion.li>
        ))}
      </ul>

      <motion.p
        className="feed-foot"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: total + 0.3, duration: 0.4 }}
      >
        2 worth a look. Summaries and first drafts are ready.
      </motion.p>
    </div>
  );
}
