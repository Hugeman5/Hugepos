"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  type Recipe,
  type Ingredient,
  type MenuItem,
  type RecipesFile,
} from "@/lib/data";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecipesPage() {
  const [recipesFile, setRecipesFile] = useState<RecipesFile | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [recipesRes, ingredientsRes, menuRes] = await Promise.all([
          fetch("/api/recipes", { cache: "no-store" }),
          fetch("/api/inventory/ingredients", { cache: "no-store" }),
          fetch("/api/admin/menu", { cache: "no-store" }),
        ]);

        if (!recipesRes.ok || !ingredientsRes.ok || !menuRes.ok) {
          throw new Error("Failed to fetch initial data");
        }

        const recipesData = await recipesRes.json();
        const ingredientsData = await ingredientsRes.json();
        const menuData = await menuRes.json();

        setRecipesFile(recipesData);
        setIngredients(Array.isArray(ingredientsData) ? ingredientsData : []);
        setMenuItems(Array.isArray(menuData?.items) ? menuData.items : []);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (e as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  // ---- Handlers (wire to your APIs when ready) ----
  const handleSaveRecipe = async (recipe: Partial<Recipe>) => {
    console.log("Saving recipe...", recipe);
    // TODO: POST/PATCH /api/recipes
    toast({ title: "Success", description: "Recipe saved." });
  };

  const handleDeleteRecipe = async (id: string) => {
    console.log("Deleting recipe", id);
    // TODO: DELETE /api/recipes/[id]
    toast({ title: "Success", description: "Recipe deleted." });
  };

  const handleLinkItem = async (itemId: string, recipeId: string) => {
    console.log(`Linking ${itemId} -> ${recipeId}`);
    // TODO: POST /api/recipes/link
    toast({ title: "Linked", description: "Item linked to recipe." });
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
            <Button onClick={() => handleSaveRecipe({})}>
              <PlusCircle className="mr-2" />
              New Recipe
            </Button>
          </div>

          {/* Recipes List */}
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
                    {/* Link Dropdown */}
                    <Select
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

                    <Button size="sm" variant="secondary" onClick={() => { /* open edit dialog */ }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRecipe(recipe.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* BOM list */}
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
