
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type Recipe, type Ingredient, type MenuItem, type RecipeLink, type RecipesFile } from '@/lib/data';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RecipesPage() {
    const [recipesFile, setRecipesFile] = useState<RecipesFile | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            try {
                const [recipesRes, ingredientsRes, menuRes] = await Promise.all([
                    fetch('/api/recipes'),
                    fetch('/api/inventory/ingredients'),
                    fetch('/api/admin/menu'),
                ]);
                if (!recipesRes.ok || !ingredientsRes.ok || !menuRes.ok) {
                    throw new Error('Failed to fetch initial data');
                }
                const recipesData = await recipesRes.json();
                const ingredientsData = await ingredientsRes.json();
                const menuData = await menuRes.json();

                setRecipesFile(recipesData);
                setIngredients(ingredientsData);
                setMenuItems(menuData.items);
            } catch(e) {
                toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);
    
    // UI Handlers (Add/Edit/Delete stubs) - these would call the API
    const handleSaveRecipe = async (recipe: Partial<Recipe>) => {
      console.log('Saving recipe...', recipe);
      // API call to POST/PATCH /api/recipes/
      toast({ title: 'Success', description: 'Recipe saved.' });
    };

    const handleDeleteRecipe = (id: string) => {
      console.log('Deleting recipe', id);
      // API call to DELETE /api/recipes/[id]
      toast({ title: 'Success', description: 'Recipe deleted.'});
    };

    const handleLinkItem = async (itemId: string, recipeId: string) => {
       console.log(`Linking ${itemId} to ${recipeId}`);
       // API call to POST /api/recipes/link
       toast({ title: 'Success', description: 'Item linked to recipe.' });
    };
    
    if(isLoading || !recipesFile) {
        return <AdminLayout title="Recipes">Loading...</AdminLayout>
    }

    return (
        <AdminLayout title="Recipes">
            <Card>
                <CardHeader>
                    <CardTitle>Recipe Management</CardTitle>
                    <CardDescription>Create recipes (Bills of Materials) and link them to menu items for inventory tracking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end mb-4">
                        <Button><PlusCircle className="mr-2"/> New Recipe</Button>
                    </div>
                    {/* Recipes List */}
                    <div className="border rounded-lg">
                        {recipesFile.recipes.map(recipe => (
                            <div key={recipe.id} className="p-4 border-b">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{recipe.name}</h3>
                                    <div className="flex items-center gap-2">
                                        {/* Link Dropdown */}
                                        <Select onValueChange={(itemId) => handleLinkItem(itemId, recipe.id)}>
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Link to item..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {menuItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm" variant="secondary"><Edit className="h-4 w-4"/></Button>
                                        <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Linked to: {recipesFile.links.find(l => l.recipeId === recipe.id) ? menuItems.find(mi => mi.id === recipesFile.links.find(l => l.recipeId === recipe.id)?.itemId)?.name : 'None'}
                                </p>
                                <ul className="mt-2 text-sm space-y-1">
                                    {recipe.bom.map((item, idx) => (
                                        <li key={idx} className="flex gap-2">
                                            <span>- {item.qty} {item.uom}</span>
                                            <span className="font-medium">{ingredients.find(i => i.id === item.ingredientId)?.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
