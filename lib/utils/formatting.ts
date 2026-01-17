import { formatDistance, format, isPast, isFuture } from "date-fns";

export function formatTimeUntil(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  if (isPast(targetDate)) {
    return "Passed";
  }

  return formatDistance(targetDate, now, { addSuffix: true });
}

export function formatDateTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  return format(targetDate, "MMM d, yyyy 'at' h:mm a");
}

export function formatDate(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  return format(targetDate, "MMM d, yyyy");
}

export function formatTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  return format(targetDate, "h:mm a");
}

export function getMarketStatus(lockTime: string, endTime: string, status: string) {
  const now = new Date();
  const lock = new Date(lockTime);
  const end = new Date(endTime);

  if (status === "resolved") return "resolved";
  if (status === "cancelled") return "cancelled";
  if (now >= lock) return "locked";
  return "open";
}

