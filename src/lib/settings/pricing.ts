// South Africa defaults
export const CURRENCY = "ZAR";
export const VAT_RATE = 0.15;            // 15%
export const PRICE_ROUNDING = 0.05;      // round to nearest 5c

export function roundPrice(p: number, step = PRICE_ROUNDING) {
  return Math.round(p / step) * step;
}
