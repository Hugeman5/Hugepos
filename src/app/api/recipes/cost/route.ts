
import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settingsRepo";
import { getRecipesFile } from "@/lib/repos/recipesRepo";
import { getAllIngredients } from "@/lib/repos/ingredientsRepo";
import { toBase } from "@/lib/uom";

function round2(n:number){ return Math.round((n + Number.EPSILON) * 100) / 100; }

export const dynamic = "force-dynamic";

export async function POST(req: Request){
  try{
    const { recipeId } = await req.json();
    if(!recipeId) return NextResponse.json({error:"recipeId required"},{status:400});

    const settings = await getSettings();
    const recipes = await getRecipesFile();
    const allIngredients = await getAllIngredients();

    const r = recipes.recipes.find(x=>x.id===recipeId);
    if(!r) return NextResponse.json({error:"Recipe not found"},{status:404});

    let baseCost = 0;

    for(const row of (r.bom ?? [])){
      const item = allIngredients.find(i=>i.id===row.ingredientId);
      if(!item) continue;
      
      const chosenUom = (row.uom || item.purchaseUom) as string;
      if (!chosenUom) {
        return NextResponse.json(
          { error: `Missing UoM for ingredient "${item.name}".` },
          { status: 400 }
        );
      }

      // effective qty inc waste
      const waste = Number(row.wastePct ?? 0);
      const qty = Number(row.qty ?? 0);
      const eff = qty * (1 + waste);

      // convert recipe qty to the ingredient purchase base
      const recipeBase = toBase(eff, chosenUom);
      const packBase   = toBase(item.purchaseSize, item.purchaseUom);

      if (recipeBase.kind !== packBase.kind) {
        return NextResponse.json({ error:`UoM mismatch for ${item.name}: ${chosenUom} vs ${item.purchaseUom}` }, { status:400 });
      }

      // price per base unit (Inc VAT)
      const packPriceInc = Number(item.priceIncVat ?? 0);
      const unitPriceInc = packPriceInc / packBase.base;

      // line cost (Inc VAT) = base units used * price/base
      const lineCostInc = unitPriceInc * recipeBase.base;

      baseCost += lineCostInc;
    }

    const packaging = Number(r.packagingCost ?? 0);
    const overheadPct = Number(r.overheadPct ?? 0);
    const targetGp = Math.min(Math.max(Number(r.targetGpPct ?? 0.6), 0), 0.95);
    const vatRate  = Number(settings.vat.defaultRate ?? 0.15);

    const overhead = baseCost * overheadPct;
    const totalCost = baseCost + overhead + packaging;
    const portions  = Math.max(Number(r.yieldPortions ?? 1), 1);
    const costPerPortion = totalCost / portions;

    const costEx = totalCost / (1 + vatRate);
    const rspEx  = costEx / (1 - targetGp);
    const vatAmt = rspEx * vatRate;
    const rspInc = rspEx + vatAmt;

    return NextResponse.json({
      currency: settings.currency ?? "ZAR",
      vatRate,
      baseCost: round2(baseCost),
      overhead: round2(overhead),
      totalCost: round2(totalCost),
      costPerPortion: round2(costPerPortion),
      exVatRSP: round2(rspEx),
      incVatRSP: round2(rspInc),
      vatAmount: round2(vatAmt),
      gp: round2(rspEx - costEx),
      gpPct: round2(targetGp * 100)
    });
  }catch(e:any){
    console.error("Costing error:", e)
    return NextResponse.json({error:e?.message ?? "Costing failed"},{status:500});
  }
}
