import "server-only";

// Ask the agent to build a first shortlist. Fire-and-forget: never blocks the user.
export async function triggerUserRun(userId: string) {
  const url = process.env.AGENT_URL;
  const secret = process.env.CRON_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(`${url}/jobs/run-user/${userId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // The daily job will pick the user up anyway.
  }
}
