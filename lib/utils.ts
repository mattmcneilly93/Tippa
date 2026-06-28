import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: string) {
  if (amount == null) return "";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount);
}

export function createInviteCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 24);
}

export const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/New_York",
})

// Knockout picks stay open until this long before each match's kickoff.
export const KNOCKOUT_LOCK_LEAD_MS = 60 * 60 * 1000; // 1 hour

// The moment a knockout match's pick closes (kickoff minus the lead time).
export function knockoutLockTime(kickoffTime: string | null | undefined) {
  if (!kickoffTime) return null;
  return new Date(new Date(kickoffTime).getTime() - KNOCKOUT_LOCK_LEAD_MS);
}

// True once a knockout match is locked for picks (within an hour of kickoff).
// A match with no scheduled kickoff stays open.
export function isKnockoutMatchLocked(
  kickoffTime: string | null | undefined,
  now: Date = new Date()
) {
  const lockTime = knockoutLockTime(kickoffTime);
  return Boolean(lockTime && lockTime <= now);
}