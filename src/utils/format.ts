/**
 * Formatting helpers — order status, money, dates
 */

export function orderStatusLabel(status: string): string {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function orderStatusColor(status: string): string {
  switch (status) {
    case "DELIVERED":
    case "APPROVED":
    case "CONFIRMED":
      return "#22C55E";
    case "IN_TRANSIT":
      return "#D4AF37";
    case "PARTIALLY_DELIVERED":
    case "PENDING_APPROVAL":
      return "#F59E0B";
    case "REJECTED":
    case "CANCELLED":
    case "DISPUTED":
      return "#EF4444";
    default:
      return "#94A3B8";
  }
}

export function fmtMoney(value: number | string | null | undefined): string {
  const v = Number(value || 0);
  return "EGP " + v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
