import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/app/CopyButton";
import { ScoreRing } from "@/components/app/ScoreRing";
import { StatusControl } from "@/components/app/StatusControl";
import { formatDeadline, formatValue } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/types";

export default async function TenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("matches").select("*, tenders(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const match = data as unknown as Match;
  const tender = match.tenders;

  return (
    <article>
      <Link className="back" href="/dashboard">Back to shortlist</Link>

      <header className="detail-head">
        <div>
          <h1>{tender?.title}</h1>
          <div className="meta">
            <span>{tender?.buyer ?? "Buyer not stated"}</span>
            <span>{formatValue(tender?.value_amount ?? null, tender?.currency ?? null)}</span>
            <span>{formatDeadline(tender?.deadline ?? null)}</span>
          </div>
          <div className="detail-actions">
            {tender?.url && (
              <a className="btn" href={tender.url} target="_blank" rel="noopener noreferrer">
                Open the official notice
              </a>
            )}
          </div>
        </div>
        <ScoreRing score={match.score} size={92} />
      </header>

      <div className="detail-grid">
        <div>
          {match.summary && (
            <section className="block">
              <h2>What the buyer wants</h2>
              <p>{match.summary}</p>
            </section>
          )}

          {match.requirements?.length > 0 && (
            <section className="block">
              <h2>Requirements to check</h2>
              <ul className="reqs">
                {match.requirements.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          <section className="block">
            <div className="draft-head">
              <h2>First draft</h2>
              {match.draft && <CopyButton text={match.draft} />}
            </div>
            {match.draft ? (
              <div className="draft">{match.draft}</div>
            ) : (
              <p>The agent writes first drafts for strong fits only. This one scored below the draft threshold.</p>
            )}
          </section>
        </div>

        <aside className="aside">
          <section className="panel block">
            <h2>Your decision</h2>
            <p>Mark it so your shortlist stays tidy.</p>
            <StatusControl matchId={match.id} status={match.status} />
          </section>

          {match.reasons?.length > 0 && (
            <section className="block">
              <h2>Why it fits</h2>
              <ul>{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}

          {match.risks?.length > 0 && (
            <section className="block">
              <h2>Worth checking</h2>
              <ul className="risk">{match.risks.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}

          {tender?.cpv_codes?.length ? (
            <section className="block">
              <h2>Notice details</h2>
              <dl className="facts">
                <div><dt>CPV codes</dt><dd>{tender.cpv_codes.join(", ")}</dd></div>
                <div><dt>Source</dt><dd>UK Find a Tender</dd></div>
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
