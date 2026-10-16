"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/lib/types";

const STATUSES: MatchStatus[] = ["new", "interested", "bidding", "dismissed"];

export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  if (!STATUSES.includes(status)) return { error: "Unknown status" };
  const supabase = await createClient();
  // Row level security ensures users can only update their own matches.
  const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
  if (error) return { error: "Couldn't update the status." };
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tenders/${matchId}`);
  return { ok: true };
}
