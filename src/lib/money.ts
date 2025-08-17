// Server + client-safe formatting helpers
export type MoneyFmt = { locale?: string; currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number };

const DEFAULTS = { locale: "en-ZA", currency: "ZAR", minimumFractionDigits: 2, maximumFractionDigits: 2 };

export function formatMoney(value: number, opts: MoneyFmt = {}): string {
  const o = { ...DEFAULTS, ...opts };
  try {
    return new Intl.NumberFormat(o.locale, { style: "currency", currency: o.currency!, minimumFractionDigits: o.minimumFractionDigits, maximumFractionDigits: o.maximumFractionDigits }).format(value ?? 0);
  } catch {
    // ultra-safe fallback: "R 123.45"
    const v = Number.isFinite(value) ? value : 0;
    return `R ${v.toFixed(o.maximumFractionDigits ?? 2)}`;
  }
}

// Round like an accountant
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;


export function cashRound(amount:number, step=0.10){ 
  return Math.round(amount/step)*step; 
}
