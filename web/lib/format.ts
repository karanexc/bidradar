export function formatValue(amount: number | null, currency: string | null) {
  if (amount == null) return "Value not stated";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: amount >= 1_000_000 ? 1 : 0,
      notation: amount >= 1_000_000 ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-GB")} ${currency ?? ""}`.trim();
  }
}

export function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
}

export function formatDeadline(deadline: string | null) {
  if (!deadline) return "No deadline stated";
  const date = new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const days = daysLeft(deadline);
  if (days == null) return `Closes ${date}`;
  if (days < 0) return `Closed ${date}`;
  if (days === 0) return `Closes today`;
  return `Closes ${date}, ${days} day${days === 1 ? "" : "s"} left`;
}
