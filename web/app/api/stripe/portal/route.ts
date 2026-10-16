import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (!profile?.stripe_customer_id) return NextResponse.redirect(`${origin}/dashboard/settings`, 303);

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/dashboard/settings`,
  });
  return NextResponse.redirect(session.url, 303);
}
