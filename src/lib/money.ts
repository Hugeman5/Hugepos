
// src/lib/money.ts
// Server + client-safe formatting helpers

export type MoneyFmt = {
  locale?: string;                  // e.g. "en-ZA"
  currency?: string;                // e.g. "ZAR"
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Format a money amount.
 * Supports:
 *   formatMoney(123.45)                       -> ZAR/en-ZA defaults
 *   formatMoney(123.45, "ZAR")                -> currency string
 *   formatMoney(123.45, { currency: "ZAR" })  -> options object
 */
export function formatMoney(
  value: number | null | undefined,
  opts?: string | MoneyFmt
): string {
  let v = Number(value);
  if (!Number.isFinite(v)) v = 0;

  // Defaults
  let locale = "en-ZA";
  let currency = "ZAR";
  let min = 2;
  let max = 2;

  if (typeof opts === "string") {
    currency = opts || "ZAR";
  } else if (opts) {
    if (opts.locale) locale = opts.locale;
    if (opts.currency) currency = opts.currency;
    if (typeof opts.minimumFractionDigits === "number") min = opts.minimumFractionDigits;
    if (typeof opts.maximumFractionDigits === "number") max = opts.maximumFractionDigits;
  }

  try {
    const nf = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    });
    return nf.format(v);
  } catch {
    // Very defensive fallback if Intl/locale not available
    const sign = v < 0 ? "-" : "";
    const abs = Math.abs(round2(v)).toFixed(Math.max(min, 2));
    // ZAR symbol
    return `${sign}R ${abs}`;
  }
}

/** Round to 2 decimals in an accountant-friendly way. */
export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Cash rounding to the nearest step (e.g., 0.10).
 * Example: cashRound(12.36, 0.10) -> 12.40
 */
export function cashRound(amount: number, step = 0.10): number {
  if (step <= 0) return round2(amount);
  const factor = 1 / step;
  return round2(Math.round(amount * factor) / factor);
}
