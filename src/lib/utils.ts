import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an integer minor-unit amount (paise/cents) into a display string.
 * Never do money math in floats — this is purely for display.
 */
export function formatMoney(amountMinorUnits: number, currency: "INR" | "USD"): string {
  const major = amountMinorUnits / 100;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(major);
}

export function generateOrderNumber(sequence: number, date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(6, "0");
  return `${yy}${mm}${dd}-${seq}`;
}
