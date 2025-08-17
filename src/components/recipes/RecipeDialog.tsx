
"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";

type Uom = "g" | "kg" | "ml" | "l" | "ea";

export type IngredientLite = { id: string; name: string };
export type BomRowEdit = { ingredientId: string; qty: number | ""; uom: Uom; wastePct: number | "" };

export type RecipeEdit = {
  id: string;           // for create, allow caller to pre-generate or use a temp id (we’ll POST full object anyway)
  name: string;
  yieldPortions: number | "";
  overheadPct: number | "";     // 0.10 = 10%
  packagingCost: number | "";
  targetGpPct: number | "";     // 0.60 = 60%
  bom: BomRowEdit[];
};

export default function RecipeDialog({
  open, mode, initial, ingredients, onClose, onSaved
}:{
  open: boolean;
  mode: "create" | "edit";
  initial?: RecipeEdit;                 // when edit, full recipe payload
  ingredients: IngredientLite[];        // provided by page
  onClose: () => void;
  onSaved: () => void;                  // refresh list on success
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
    setForm(f => ({ ...f, bom: [...f.bom, { ingredientId: ingredients[0]?.id ?? "", qty: "", uom: "g", wastePct: 0 }] }));
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
      <DialogContent className="max-w-3xl">
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
            {form.bom.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Label>Ingredient</Label>
                  <Select value={row.ingredientId} onValueChange={v=>setBom(i,{ ingredientId:v })}>
                    <SelectTrigger><SelectValue placeholder="Choose ingredient" /></SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ing=>(
                        <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Qty</Label>
                  <Input inputMode="decimal" value={row.qty} onChange={e=>setBom(i,{ qty: toNum(e.target.value) })}/>
                </div>
                <div className="col-span-2">
                  <Label>UoM</Label>
                  <Select value={row.uom} onValueChange={v=>setBom(i,{ uom: v as Uom })}>
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
                <div className="col-span-2">
                  <Label>Waste %</Label>
                  <Input inputMode="decimal" value={row.wastePct}
                    onChange={e=>setBom(i,{ wastePct: toNum(e.target.value) })}/>
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" onClick={()=>removeRow(i)} aria-label="Remove row">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {form.bom.length === 0 && <p className="text-sm opacity-70">No BOM rows yet.</p>}
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
