
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Recipe, type RecipesFile } from "@/lib/repos/recipesRepo";
import { type Ingredient } from "@/lib/repos/ingredientsRepo";
import { type MenuItem, type Menu } from "@/lib/menuRepo";
import RecipeDialog, { type RecipeEdit, type IngredientLite } from "@/components/recipes/RecipeDialog";
import ConfirmDialog from "@/components/ConfirmDialog";


import { PlusCircle, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/money";

type CostingResult = {
    currency: string;
    vatRate: number;
    baseCost: number;
    overhead: number;
    totalCost: number;
    costPerPortion: number;
    exVatRSP: number;
    incVatRSP: number;
    vatAmount: number;
    gp: number;
    gpPct: number;
}

const CostingDisplay = ({ recipeId }: { recipeId: string }) => {
    const [cost, setCost] = useState<CostingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const fetchCost = useCallback(async () => {
        if (!isOpen || !recipeId) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/recipes/cost", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ recipeId }) });
            if(!res.ok) throw new Error("Cost calculation failed");
            const data = await res.json();
            setCost(data);
        } catch (e) {
            toast({ variant: 'destructive', title: "Costing Error", description: (e as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [recipeId, isOpen, toast]);
    
    useEffect(() => {
        if (isOpen) {
            fetchCost();
        }
    }, [isOpen, fetchCost]);

    return (
        <div className="mt-2 border-t border-zinc-700 pt-2">
            <button onClick={() => setIsOpen(o => !o)} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 w-full text-left">
                {isOpen ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                Costing & Suggested Price
            </button>
            {isOpen && (
                <div className="p-2 mt-2 bg-zinc-900 rounded-md text-xs space-y-2">
                    {isLoading && <p>Calculating...</p>}
                    {cost && (
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                           <span className="text-zinc-400">Total Cost</span><span className="font-mono text-right">{formatMoney(cost.totalCost, cost.currency)}</span>
                           <span className="text-zinc-400">Cost/Portion</span><span className="font-mono text-right">{formatMoney(cost.costPerPortion, cost.currency)}</span>
                           <span className="text-zinc-400 col-span-2 border-b border-zinc-700 my-1"></span>
                           <span className="text-zinc-400">Target GP</span><span className="font-mono text-right">{(cost.gpPct).toFixed(0)}%</span>
                           <span className="text-zinc-400">Ex-VAT RSP</span><span className="font-mono text-right">{formatMoney(cost.exVatRSP, cost.currency)}</span>
                           <span className="text-zinc-400">VAT ({(cost.vatRate * 100).toFixed(0)}%)</span><span className="font-mono text-right">{formatMoney(cost.vatAmount, cost.currency)}</span>
                           <span className="text-zinc-400 font-bold">Inc-VAT RSP</span><span className="font-mono text-right font-bold">{formatMoney(cost.incVatRSP, cost.currency)}</span>
                       </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function RecipesPage() {
  const [recipesFile, setRecipesFile] = useState<RecipesFile | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeEdit | null>(null);
  
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recipesRes, ingredientsRes, menuRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/inventory/ingredients"),
        fetch("/api/admin/menu"),
      ]);

      if (!recipesRes.ok || !ingredientsRes.ok || !menuRes.ok) {
        throw new Error("Failed to fetch initial data");
      }
      
      const recipesData: RecipesFile = await recipesRes.json();
      const ingredientsData: Ingredient[] = await ingredientsRes.json();
      const menuData: Menu = await menuRes.json();

      setRecipesFile(recipesData);
      setIngredients(ingredientsData);
      setMenuItems(menuData.items);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (e as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ingredientsLite: IngredientLite[] = useMemo(() => ingredients.map(i => ({ id: i.id, name: i.name })), [ingredients]);
  
  const handleOpenNewDialog = () => {
      setSelectedRecipe({ id: `rec_${Date.now()}`, name: 'New Recipe', yieldPortions: 1, overheadPct: 0.1, packagingCost: 0, targetGpPct: 0.6, bom: [] });
      setDialogMode('create');
  }
  
  const handleOpenEditDialog = (recipe: Recipe) => {
      setSelectedRecipe({ ...recipe, yieldPortions: recipe.yieldPortions || 1, overheadPct: recipe.overheadPct || 0, packagingCost: recipe.packagingCost || 0, targetGpPct: recipe.targetGpPct || 0.6, bom: recipe.bom.map(b => ({ ...b, qty: b.qty || "", wastePct: b.wastePct || 0 })) });
      setDialogMode('edit');
  }

  const handleOpenDeleteDialog = (recipeId: string) => {
    setRecipeToDelete(recipeId);
    setIsConfirmDeleteOpen(true);
  }
  
  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/recipes/${recipeToDelete}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        toast({ title: "Success", description: "Recipe deleted." });
        await fetchData();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
        setIsDeleting(false);
        setIsConfirmDeleteOpen(false);
        setRecipeToDelete(null);
    }
  }

  async function handleLinkItem(itemId: string, recipeId: string) {
    try {
        const res = await fetch("/api/recipes/link", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ itemId, recipeId }) });
        if(!res.ok) throw new Error("Link failed");
        toast({ title: "Linked", description: "Item linked to recipe." });
        await fetchData();
    } catch (e) {
         toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  

  if (isLoading || !recipesFile) {
    return <AdminLayout title="Recipes">Loading...</AdminLayout>;
  }

  const linkedItemName = (recipeId: string) => {
    const link = recipesFile.links.find((l) => l.recipeId === recipeId);
    if (!link) return "None";
    const item = menuItems.find((m) => m.id === link.itemId);
    return item?.name ?? "None";
  };

  return (
    <AdminLayout title="Recipes">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Management</CardTitle>
          <CardDescription>
            Create recipes (Bills of Materials) and link them to menu items for
            inventory tracking.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={handleOpenNewDialog}>
              <PlusCircle className="mr-2" />
              New Recipe
            </Button>
          </div>

          <div className="border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {(recipesFile.recipes ?? []).map((recipe) => (
              <div key={recipe.id} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold">{recipe.name}</h3>
                    <p className="text-sm text-zinc-400">
                      Linked to: {linkedItemName(recipe.id)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={recipesFile.links.find(l => l.recipeId === recipe.id)?.itemId}
                      onValueChange={(itemId) => handleLinkItem(itemId, recipe.id)}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Link to item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="secondary" onClick={() => handleOpenEditDialog(recipe) }>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleOpenDeleteDialog(recipe.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ul className="mt-3 text-sm space-y-1">
                  {(recipe.bom ?? []).map((row, idx) => {
                    const ing = ingredients.find((i) => i.id === row.ingredientId);
                    return (
                      <li key={idx} className="flex gap-2">
                        <span>- {row.qty} {row.uom}</span>
                        <span className="font-medium">
                          {ing?.name ?? row.ingredientId}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                 <CostingDisplay recipeId={recipe.id} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <RecipeDialog
        open={!!dialogMode}
        mode={dialogMode || 'create'}
        initial={selectedRecipe ?? undefined}
        ingredients={ingredientsLite}
        onClose={() => setDialogMode(null)}
        onSaved={fetchData}
      />
      
      <ConfirmDialog
        open={isConfirmDeleteOpen}
        title="Delete Recipe"
        message="Are you sure you want to delete this recipe? This action cannot be undone."
        onCancel={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        busy={isDeleting}
      />
    </AdminLayout>
  );
}
