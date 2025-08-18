
// src/lib/uom.ts
type BaseKind = "mass" | "volume" | "each";

const aliases: Record<string, { kind: BaseKind; toBase: number }> = {
  g:   { kind: "mass",   toBase: 1 },
  kg:  { kind: "mass",   toBase: 1000 },
  ml:  { kind: "volume", toBase: 1 },
  l:   { kind: "volume", toBase: 1000 },
  ea:  { kind: "each",   toBase: 1 },
  each:{ kind: "each",   toBase: 1 },
};

export function normalizeUom(u: string) {
  const k = String(u || "").trim().toLowerCase();
  if (!aliases[k]) throw new Error(`Unsupported UoM: ${u}`);
  return k as keyof typeof aliases;
}

export function toBase(qty: number, uom: string) {
  const key = normalizeUom(uom);
  const meta = aliases[key];
  return { kind: meta.kind, base: Number(qty) * meta.toBase, unit: key };
}
