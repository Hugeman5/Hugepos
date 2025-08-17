

// src/lib/uom.ts
export type UomKind = "mass" | "volume" | "each";

const aliases: Record<string,{norm:string, kind:UomKind, toBase:number}> = {
  // mass base = gram
  g:{norm:"g",kind:"mass",toBase:1}, gram:{norm:"g",kind:"mass",toBase:1},
  kg:{norm:"kg",kind:"mass",toBase:1000}, kilogram:{norm:"kg",kind:"mass",toBase:1000},

  // volume base = milliliter
  ml:{norm:"ml",kind:"volume",toBase:1}, milliliter:{norm:"ml",kind:"volume",toBase:1},
  l:{norm:"l",kind:"volume",toBase:1000}, liter:{norm:"l",kind:"volume",toBase:1000},

  // count base = each
  ea:{norm:"ea",kind:"each",toBase:1}, each:{norm:"ea",kind:"each",toBase:1}, unit:{norm:"ea",kind:"each",toBase:1},
};

export function normalizeUom(u:string){ 
  const k = String(u||"").trim().toLowerCase();
  if (!(k in aliases)) throw new Error(`Unsupported UoM: ${u}`);
  return aliases[k];
}

// Convert VALUE from FROM_UOM to TO_UOM (compatible kinds only)
export function convert(value:number, from:string, to:string){
  const f = normalizeUom(from); const t = normalizeUom(to);
  if (f.kind !== t.kind) throw new Error(`Incompatible UoM: ${from} → ${to}`);
  // convert to base, then to target
  const base = value * f.toBase;
  return base / t.toBase;
}

// Convert VALUE FROM_UOM to *base* units of its kind (g, ml, ea)
export function toBase(value:number, from:string){
  const f = normalizeUom(from);
  return { kind:f.kind, base: value * f.toBase };
}
