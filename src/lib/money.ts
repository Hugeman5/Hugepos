
export function round2(n:number){ return Math.round((n + Number.EPSILON) * 100) / 100; }

export function formatMoney(n:number, currency="ZAR", locale="en-ZA"){
  try { return new Intl.NumberFormat(locale, { style:"currency", currency }).format(n); }
  catch { return `R ${n.toFixed(2)}`; }
}
