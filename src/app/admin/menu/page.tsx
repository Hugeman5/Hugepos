
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { type Category, type MenuItem, type Menu } from '@/lib/menuRepo';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getSettings, type Settings } from '@/lib/settingsRepo';

export default function MenuBuilderPage() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const money = (value: number) => {
    if (!settings) return `R ${value.toFixed(2)}`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/menu');
      if (!res.ok) throw new Error('Failed to load menu');
      const data = await res.json();
      setMenu(data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleSaveItem = async () => {
    if (!editingItem) return;

    const url = editingItem.id ? `/api/admin/menu/items/${editingItem.id}` : '/api/admin/menu/items';
    const method = editingItem.id ? 'PATCH' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingItem)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || `Failed to save item`);
        }
        toast({ title: 'Success', description: 'Menu item saved.' });
        setIsItemDialogOpen(false);
        fetchData();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
     try {
        const res = await fetch(`/api/admin/menu/items/${itemId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete item');
        toast({ title: 'Success', description: 'Item deleted.'});
        fetchData();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }
  
  const handleSaveCategory = async () => {
     if (!editingCategory) return;

    const url = editingCategory.id ? `/api/admin/menu/categories/${editingCategory.id}` : '/api/admin/menu/categories';
    const method = editingCategory.id ? 'PATCH' : 'POST';
    
     try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingCategory)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || `Failed to save category`);
        }
        toast({ title: 'Success', description: 'Category saved.' });
        setIsCategoryDialogOpen(false);
        fetchData();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }
  
  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm("Are you sure? This will also delete all items in this category.")) return;
     try {
        const res = await fetch(`/api/admin/menu/categories/${catId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete category');
        toast({ title: 'Success', description: 'Category deleted.'});
        fetchData();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }


  if (isLoading || !menu || !settings) {
    return <AdminLayout title="Menu Builder">Loading...</AdminLayout>;
  }

  const handleModifierSetSelection = (setId: string, checked: boolean) => {
    setEditingItem(currentItem => {
        if (!currentItem) return null;
        const existingIds = currentItem.modifierSetIds || [];
        if (checked) {
            return { ...currentItem, modifierSetIds: [...existingIds, setId] };
        } else {
            return { ...currentItem, modifierSetIds: existingIds.filter(id => id !== setId) };
        }
    });
  };

  return (
    <AdminLayout title="Menu Builder">
      <div className="flex justify-end mb-4">
        <Button asChild variant="secondary">
          <Link href="/admin/menu/import-export">Import / Export</Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Categories Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Categories</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => { setEditingCategory({name: '', color: '#5FB9A4', active: true, sort: 0}); setIsCategoryDialogOpen(true); }}>
                <PlusCircle className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {menu.categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-brand-muted">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="flex-1 font-medium">{cat.name}</span>
                         <Switch checked={cat.active} onCheckedChange={async (active) => {
                             // This is a fire-and-forget for quick toggling
                             updateCategory(cat.id, { active });
                             fetchData();
                         }} />
                        <Button size="icon" variant="ghost" onClick={() => { setEditingCategory(cat); setIsCategoryDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                        </Button>
                         <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Items Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Menu Items</CardTitle>
              <Button onClick={() => { setEditingItem({ name: '', catId: menu.categories[0]?.id, priceCents: 0, taxCode: 'STD15', active: true }); setIsItemDialogOpen(true); }}>
                <PlusCircle className="mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {menu.items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{menu.categories.find(c => c.id === item.catId)?.name}</TableCell>
                            <TableCell>{money(item.priceCents / 100)}</TableCell>
                            <TableCell><Badge variant={item.active ? 'default' : 'secondary'}>{item.active ? 'Yes' : 'No'}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setIsItemDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Item Edit Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingItem?.id ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
              {editingItem && (
                  <div className="grid md:grid-cols-2 gap-8 py-4">
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <Label>Name</Label>
                              <Input value={editingItem.name} onChange={e => setEditingItem(i => i ? {...i, name: e.target.value} : null)} />
                          </div>
                          <div className="space-y-2">
                              <Label>Category</Label>
                              <Select value={editingItem.catId} onValueChange={catId => setEditingItem(i => i ? {...i, catId} : null)}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>{menu.categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label>Price (in cents)</Label>
                              <Input type="number" value={editingItem.priceCents} onChange={e => setEditingItem(i => i ? {...i, priceCents: parseInt(e.target.value)} : null)} />
                          </div>
                           <div className="flex items-center space-x-2">
                               <Switch id="item-active" checked={!!editingItem.active} onCheckedChange={active => setEditingItem(i => i ? {...i, active} : null)} />
                               <Label htmlFor="item-active">Active</Label>
                           </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Modifier Sets</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                           {menu.modifierSets.map(set => (
                               <div key={set.id} className="flex items-center space-x-3">
                                   <Checkbox 
                                        id={`mod-set-${set.id}`}
                                        checked={editingItem.modifierSetIds?.includes(set.id)}
                                        onCheckedChange={(checked) => handleModifierSetSelection(set.id, !!checked)}
                                   />
                                   <Label htmlFor={`mod-set-${set.id}`}>{set.name}</Label>
                               </div>
                           ))}
                        </div>
                      </div>
                  </div>
              )}
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveItem}>Save Item</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* Category Edit Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
              {editingCategory && (
                  <div className="grid gap-4 py-4">
                       <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editingCategory.name} onChange={e => setEditingCategory(c => c ? {...c, name: e.target.value} : null)} />
                      </div>
                       <div className="space-y-2">
                          <Label>Color</Label>
                          <Input type="color" value={editingCategory.color} onChange={e => setEditingCategory(c => c ? {...c, color: e.target.value} : null)} />
                      </div>
                       <div className="flex items-center space-x-2">
                           <Switch id="cat-active" checked={!!editingCategory.active} onCheckedChange={active => setEditingCategory(c => c ? {...c, active} : null)} />
                           <Label htmlFor="cat-active">Visible</Label>
                       </div>
                  </div>
              )}
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveCategory}>Save Category</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
    </AdminLayout>
  );
}

// Dummy function to satisfy TS, will be replaced by actual API call
async function updateCategory(id: string, patch: any) {}
