import { ProfileForm } from "@/components/app/ProfileForm";
import { hasAccess, trialDaysLeft } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const { billing } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();
  if (!profile) return null;

  const active = profile.subscription_status === "active";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Changes apply from the agent&apos;s next morning run.</p>
        </div>
      </div>

      <div className="settings">
        <ProfileForm profile={profile} mode="settings" />

        <aside className="panel">
          <h2>Billing</h2>
          {billing === "success" && <p className="form-ok">Thanks! Your subscription is being activated.</p>}
          {active ? (
            <>
              <p>Your subscription is active. £49 a month.</p>
              <form action="/api/stripe/portal" method="post">
                <button className="btn btn-quiet" type="submit">Manage billing</button>
              </form>
            </>
          ) : (
            <>
              <p>
                {hasAccess(profile)
                  ? `Free trial: ${trialDaysLeft(profile)} days left. Subscribe any time to keep your shortlist coming.`
                  : "Your shortlist is paused. Subscribe to start receiving tenders again."}
              </p>
              <form action="/api/stripe/checkout" method="post">
                <button className="btn" type="submit">Subscribe for £49 a month</button>
              </form>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
