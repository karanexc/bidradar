import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card">
        <h1 style={{ font: "720 2rem/1.1 var(--display)" }}>This page doesn&apos;t exist</h1>
        <p style={{ color: "var(--ink-soft)" }}>It may have been removed, or the link is wrong.</p>
        <Link className="btn" href="/dashboard">Go to your shortlist</Link>
      </div>
    </main>
  );
}
