import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { ProfileForm } from "@/components/app/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/dashboard");

  return (
    <main className="wrap" style={{ maxWidth: 760, padding: "40px 24px 80px" }}>
      <BrandMark />
      <div className="page-head" style={{ marginTop: 40 }}>
        <div>
          <h1>Tell the agent what you do</h1>
          <p>It uses this to read every new tender for you. You can change it any time.</p>
        </div>
      </div>
      <ProfileForm profile={profile} mode="onboarding" />
    </main>
  );
}
