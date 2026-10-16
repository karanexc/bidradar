"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const next = safeNext(params.get("next"));
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === "sent" ? (
        <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <h1>Check your inbox</h1>
          <p>
            We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue.
          </p>
          <button className="link-button" onClick={() => setState("idle")}>
            Use a different email
          </button>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
          <h1>Sign in to BidRadar</h1>
          <p>Enter your work email and we&apos;ll send you a sign-in link. New here? This starts your 14-day free trial.</p>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {state === "error" && <p className="form-error">Couldn&apos;t send the link: {error}</p>}
          <button className="btn" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending link…" : "Send sign-in link"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export default function LoginPage() {
  return (
    <main className="auth">
      <div className="auth-card">
        <BrandMark />
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
