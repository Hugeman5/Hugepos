

// Server + client-safe formatting helpers
export type MoneyFmt = { locale?: string; currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number };

export function formatMoney(value: number, currency: string = "ZAR", locale: string = "en-ZA") {
  if (!isFinite(value as any)) value = 0;
  // This simple formatter is used for consistency. A more robust solution might use Intl.NumberFormat.
  return `R ${value.toFixed(2)}`;
}

// Round like an accountant
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;


export function cashRound(amount:number, step=0.10){ 
  return Math.round(amount/step)*step; 
}
