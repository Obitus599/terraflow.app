/**
 * Display helpers — locale set to en-AE since revenue is AED only.
 */

const aedFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

export function formatAed(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return aedFormatter.format(amount);
}

export function formatAedCompact(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (Math.abs(amount) >= 1000) {
    return `AED ${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }
  return aedFormatter.format(amount);
}

export function initialsOf(fullName: string | null | undefined): string {
  if (!fullName) return "—";
  return fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
