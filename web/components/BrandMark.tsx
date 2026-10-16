import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href}>
      <svg width="30" height="30" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="22" cy="22" r="11" fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
        <path d="M22 22 L22 2 A20 20 0 0 1 39.3 12 Z" fill="var(--brass)" opacity=".85" />
        <circle cx="30" cy="13" r="3" fill="var(--brass)" />
      </svg>
      BidRadar
    </Link>
  );
}
