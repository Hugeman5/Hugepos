
"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import IngredientPicker from "@/components/recipes/IngredientPicker";
import { lineCostIncVat } from "@/lib/costing";
import { type Ingredient } from "@/lib/repos/ingredientsRepo";


export type IngredientLite = { id: string; name: string };
export type BomRowEdit = { ingredientId: string; qty: number | ""; uom: string; wastePct: number | "" };

export type RecipeEdit = {
  id: string;
  name: string;
  yieldPortions: number | "";
  overheadPct: number | "";
  packagingCost: number | "";
  targetGpPct: number | "";
  bom: BomRowEdit[];
};

type Pricing = Ingredient;

const VAT_DEFAULT = 0.15;
const currency = "ZAR";


export default function RecipeDialog({
  open, mode, initial, ingredients,
  ingredientsPricing = {},
  onClose, onSaved
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: RecipeEdit;
  ingredients: IngredientLite[];
  ingredientsPricing?: Record<string, Pricing>;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState<RecipeEdit>(() =>
    initial ?? {
      id: "",
      name: "",
      yieldPortions: "",
      overheadPct: "",
      packagingCost: "",
      targetGpPct: "",
      bom: []
    }
  );
  
  const ingOptions = useMemo(
    () => ingredients.map(i => ({ id: i.id, name: i.name })),
    [ingredients]
  );

  useEffect(() => { if (open) setForm(initial ?? {
    id: "", name: "", yieldPortions:"", overheadPct:"", packagingCost:"", targetGpPct:"", bom:[]
  }); }, [open, initial]);

  function set<K extends keyof RecipeEdit>(k: K, v: RecipeEdit[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function setBom(i:number, patch: Partial<BomRowEdit>) {
    setForm(f => ({ ...f, bom: f.bom.map((r,idx)=> idx===i ? { ...r, ...patch } : r) }));
  }

  function addRow() {
    setForm(f => ({ ...f, bom: [...f.bom, { ingredientId: "", qty: "", uom: "g", wastePct: 0 }] }));
  }

  function removeRow(i:number){
    setForm(f => ({ ...f, bom: f.bom.filter((_,idx)=>idx!==i) }));
  }

  const invalid = useMemo(() => {
    if (!form.name.trim()) return "Name required";
    if (form.yieldPortions === "" || Number(form.yieldPortions) <= 0) return "Yield must be > 0";
    if (form.overheadPct === "" || Number(form.overheadPct) < 0) return "Overhead % required";
    if (form.packagingCost === "" || Number(form.packagingCost) < 0) return "Packaging cost required";
    if (form.targetGpPct === "" || Number(form.targetGpPct) <= 0 || Number(form.targetGpPct) >= 0.95) return "Target GP% must be between 0 and 0.95";
    if (form.bom.length === 0) return "Add at least one BOM row";
    for (const r of form.bom) {
      if (!r.ingredientId) return "BOM: ingredient required";
      if (r.qty === "" || Number(r.qty) <= 0) return "BOM: qty must be > 0";
      if (!r.uom) return "BOM: uom required";
      if (r.wastePct === "" || Number(r.wastePct) < 0) return "BOM: waste % invalid";
    }
    return "";
  }, [form]);
  
  const bomTotals = useMemo(() => {
    return (form.bom || []).reduce((acc, r) => {
      const ingredient = ingredientsPricing[r.ingredientId];
      if (!ingredient) return acc;
      
      const inc = lineCostIncVat({
          ingredient: ingredient,
          qty: Number(r.qty || 0),
          uom: r.uom,
          wastePct: Number(r.wastePct || 0)
      });
      const ex = inc / (1 + (ingredient.vatRate || VAT_DEFAULT));

      acc.ex += ex;
      acc.inc += inc;
      return acc;
    }, { ex: 0, inc: 0 });
  }, [form.bom, ingredientsPricing]);


  async function save() {
    if (invalid) return;
    setWorking(true);
    const payload = {
      id: form.id || cryptoRandId(),
      name: form.name.trim(),
      yieldPortions: Number(form.yieldPortions),
      overheadPct: Number(form.overheadPct),
      packagingCost: Number(form.packagingCost),
      targetGpPct: Number(form.targetGpPct),
      bom: form.bom.map(r => ({
        ingredientId: r.ingredientId,
        qty: Number(r.qty),
        uom: r.uom,
        wastePct: Number(r.wastePct || 0)
      }))
    };
    const url = mode === "create" ? "/api/recipes" : `/api/recipes/${payload.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body = mode === "create" ? payload : { ...payload, id: undefined }; // PATCH merges

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setWorking(false);
    if (!res.ok) {
      alert(`Save failed (${res.status})`);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Recipe" : "Edit Recipe"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={e=>set("name", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="yield">Yield (portions)</Label>
            <Input id="yield" inputMode="numeric" value={form.yieldPortions}
              onChange={e=>set("yieldPortions", toNum(e.target.value))}/>
          </div>

          <div>
            <Label htmlFor="overhead">Overhead % (e.g. 0.10)</Label>
            <Input id="overhead" inputMode="decimal" value={form.overheadPct}
              onChange={e=>set("overheadPct", toNum(e.target.value))}/>
          </div>

          <div>
            <Label htmlFor="packaging">Packaging Cost</Label>
            <Input id="packaging" inputMode="decimal" value={form.packagingCost}
              onChange={e=>set("packagingCost", toNum(e.target.value))}/>
          </div>

          <div>
            <Label htmlFor="gp">Target GP % (e.g. 0.60)</Label>
            <Input id="gp" inputMode="decimal" value={form.targetGpPct}
              onChange={e=>set("targetGpPct", toNum(e.target.value))}/>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Bill of Materials</h3>
            <Button type="button" onClick={addRow} variant="secondary" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" /> Add row
            </Button>
          </div>

          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-[1fr_90px_90px_110px_120px_120px_40px] gap-2 px-2 text-xs text-zinc-400">
              <span>Ingredient</span>
              <span className="text-left">Qty</span>
              <span className="text-left">UoM</span>
              <span className="text-left">Waste %</span>
              <span className="text-right">Cost ex VAT</span>
              <span className="text-right">Cost inc VAT</span>
              <span></span>
            </div>
            {form.bom.map((row, i) => {
              const ingredient = ingredientsPricing[row.ingredientId];
              const costs = { ex: 0, inc: 0 };
              if (ingredient && row.uom) {
                  costs.inc = lineCostIncVat({
                      ingredient: ingredient,
                      qty: Number(row.qty || 0),
                      uom: row.uom,
                      wastePct: Number(row.wastePct || 0)
                  });
                  costs.ex = costs.inc / (1 + (ingredient.vatRate || VAT_DEFAULT));
              }
              
              return (
                <div key={i} className="grid grid-cols-[1fr_90px_90px_110px_120px_120px_40px] gap-2 items-end">
                  <IngredientPicker
                    options={ingOptions}
                    value={row.ingredientId}
                    onChange={(id) => setBom(i, { ingredientId: id })}
                    className="min-w-[220px]"
                  />
                  <div>
                    <Input inputMode="decimal" value={row.qty} onChange={e=>setBom(i,{ qty: toNum(e.target.value) })}/>
                  </div>
                  <div>
                    <Select value={row.uom} onValueChange={v=>setBom(i,{ uom: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="ea">ea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input inputMode="decimal" value={row.wastePct}
                      onChange={e=>setBom(i,{ wastePct: toNum(e.target.value) })}/>
                  </div>
                  <div className="text-right font-mono text-sm pr-2">{costs.ex > 0 ? formatMoney(costs.ex, { currency }) : '-'}</div>
                  <div className="text-right font-mono text-sm pr-2">{costs.inc > 0 ? formatMoney(costs.inc, { currency }) : '-'}</div>
                  <div>
                    <Button type="button" variant="ghost" onClick={()=>removeRow(i)} aria-label="Remove row">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {form.bom.length === 0 && <p className="text-sm opacity-70">No BOM rows yet.</p>}
          </div>

          <div className="mt-3 border-t border-zinc-700 pt-2 text-sm grid grid-cols-2 gap-y-1 max-w-sm ml-auto">
            <div className="text-zinc-400">Total Cost ex VAT</div>
            <div className="text-right font-mono">{formatMoney(bomTotals.ex, { currency })}</div>
            <div className="text-zinc-400">Total Cost inc VAT</div>
            <div className="text-right font-mono">{formatMoney(bomTotals.inc, { currency })}</div>
          </div>

        </div>

        {invalid && <p className="text-sm text-red-500 mt-2">{invalid}</p>}

        <DialogFooter className="mt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={working}>Cancel</Button>
          <Button type="button" onClick={save} disabled={!!invalid || working}>
            {working ? "Saving…" : (mode === "create" ? "Create Recipe" : "Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toNum(v:string): number | "" {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : "";
}

function cryptoRandId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  return "r_" + Math.random().toString(36).slice(2,9);
}


    