import type { Timestamp } from "@/backend";

/**
 * Convert a Motoko `Time.now()` nanosecond bigint into a JavaScript `Date`.
 * Returns `null` when the value cannot form a valid date.
 */
export function timestampToDate(timestamp: Timestamp): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp as a localized date-time string. */
export function formatTimestamp(
  timestamp: Timestamp,
  locale = "en-IN",
): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Format a remaining-seconds countdown as `HH:MM:SS`.
 * Negative or non-finite input clamps to zero.
 */
export function formatCountdown(totalSeconds: number | bigint): string {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds)));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}
