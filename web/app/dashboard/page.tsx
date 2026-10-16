import Link from "next/link";
import { MatchList } from "@/components/app/MatchList";
import { hasAccess, trialDaysLeft } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import type { Match, MatchStatus, Profile } from "@/lib/types";

const TABS: { key: "active" | MatchStatus; label: string }[] = [
  { key: "active", label: "To review" },
  { key: "interested", label: "Interested" },
  { key: "bidding", label: "Bidding" },
  { key: "dismissed", label: "Not for us" },
];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; welcome?: string }>;
}) {
  const { view = "active", welcome } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();

  let query = supabase
    .from("matches")
    .select("id, score, verdict, reasons, status, created_at, tenders(id, title, buyer, value_amount, currency, deadline, source)")
    .order("created_at", { ascending: false })
    .order("score", { ascending: false })
    .limit(100);
  query = view === "active" ? query.eq("status", "new") : query.eq("status", view);
  const { data } = await query;
  const matches = (data ?? []) as unknown as Match[];

  return (
    <>
      {profile && !hasAccess(profile) && (
        <div className="banner">
          <p>Your free trial has ended, so new tenders are paused.</p>
          <Link className="btn btn-small" href="/dashboard/settings">Subscribe to resume</Link>
        </div>
      )}
      {profile?.subscription_status === "trialing" && hasAccess(profile) && trialDaysLeft(profile) <= 3 && (
        <div className="banner">
          <p>{trialDaysLeft(profile)} days left in your free trial.</p>
          <Link className="btn btn-small" href="/dashboard/settings">Subscribe</Link>
        </div>
      )}

      <div className="page-head">
        <div>
          <h1>Your shortlist</h1>
          <p>Tenders the agent thinks {profile?.company_name ?? "you"} could win, newest first.</p>
        </div>
      </div>

      <nav className="tabs" aria-label="Filter by status">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "active" ? "/dashboard" : `/dashboard?view=${t.key}`} aria-current={view === t.key ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      {matches.length > 0 ? (
        <MatchList matches={matches} />
      ) : (
        <div className="empty">
          <svg width="56" height="56" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="20" fill="none" stroke="var(--rule)" strokeWidth="2" />
            <circle cx="22" cy="22" r="11" fill="none" stroke="var(--rule)" strokeWidth="1.5" />
            <path d="M22 22 L22 2 A20 20 0 0 1 39.3 12 Z" fill="var(--brass)" opacity=".6" />
          </svg>
          {welcome && view === "active" ? (
            <>
              <h2>The agent is reading this week&apos;s tenders</h2>
              <p>Your first shortlist usually appears within a few minutes. Refresh this page shortly.</p>
            </>
          ) : view === "active" ? (
            <>
              <h2>Nothing new to review</h2>
              <p>The agent checks new tenders every weekday morning. If nothing turns up for a while, try adding more keywords.</p>
              <Link className="btn btn-quiet" href="/dashboard/settings">Edit what you do</Link>
            </>
          ) : (
            <>
              <h2>No tenders here yet</h2>
              <p>Tenders you mark from the shortlist will show up here.</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
