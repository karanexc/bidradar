import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).single();
  if (!profile?.onboarded) redirect("/onboarding");

  return (
    <>
      <AppNav />
      <main className="wrap app-main">{children}</main>
    </>
  );
}
