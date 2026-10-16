"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

export function AppNav() {
  const path = usePathname();
  const current = (href: string) => (path === href ? "page" : undefined);

  return (
    <header className="app-nav">
      <div className="wrap">
        <BrandMark href="/dashboard" />
        <nav aria-label="App">
          <Link href="/dashboard" aria-current={current("/dashboard")}>Shortlist</Link>
          <Link href="/dashboard/settings" aria-current={current("/dashboard/settings")}>Settings</Link>
          <form action="/auth/signout" method="post">
            <button className="link-button" type="submit">Sign out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
