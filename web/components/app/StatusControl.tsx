"use client";

import { useOptimistic, useTransition } from "react";
import { updateMatchStatus } from "@/app/actions/matches";
import { STATUS_LABELS, type MatchStatus } from "@/lib/types";

const ORDER: MatchStatus[] = ["new", "interested", "bidding", "dismissed"];

export function StatusControl({ matchId, status }: { matchId: string; status: MatchStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();

  return (
    <div className="status-group" role="group" aria-label="Your decision">
      {ORDER.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={optimistic === s}
          onClick={() =>
            startTransition(async () => {
              setOptimistic(s);
              await updateMatchStatus(matchId, s);
            })
          }
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
