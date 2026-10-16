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

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: user.id,
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    allow_promotion_codes: true,
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${origin}/dashboard/settings?billing=success`,
    cancel_url: `${origin}/dashboard/settings`,
  });

  return NextResponse.redirect(session.url!, 303);
}
