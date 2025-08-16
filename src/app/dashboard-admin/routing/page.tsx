
'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { type RoutingRules, type Station, type Product, type Category } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function RoutingPage() {
  const [routing, setRouting] = useState<RoutingRules | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [routingRes, stationsRes, menuRes] = await Promise.all([
        fetch('/api/admin/routing'),
        fetch('/api/admin/stations'),
        fetch('/api/menu'),
      ]);

      if (!routingRes.ok) throw new Error('Failed to fetch routing rules.');
      if (!stationsRes.ok) throw new Error('Failed to fetch stations.');
      if (!menuRes.ok) throw new Error('Failed to fetch menu data.');

      const routingData = await routingRes.json();
      const stationsData = await stationsRes.json();
      const menuData = await menuRes.json();
      
      const allProducts: Product[] = Object.values(menuData.productsByCategory).flat();

      setRouting(routingData);
      setStations(stationsData);
      setProducts(allProducts);
      setCategories(menuData.categories);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleSaveChanges = async () => {
      if (!routing) return;
      setIsSaving(true);
      try {
          const res = await fetch('/api/admin/routing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(routing)
          });
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || 'Failed to save routing rules.');
          }
          toast({ title: 'Success', description: 'KDS routing rules saved.' });
          fetchData();
      } catch(error) {
           toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
          setIsSaving(false);
      }
  }
  
  if (isLoading || !routing) {
      return (
          <div className="flex min-h-screen w-full flex-col">
            <DashboardHeader title="KDS Routing Management" userName="Admin User" userRole="Admin" />
            <main className="flex flex-1 items-center justify-center">Loading routing data...</main>
          </div>
      )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader title="KDS Routing Management" userName="Admin User" userRole="Admin" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">

        <Card>
          <CardHeader>
            <CardTitle>Default Station</CardTitle>
            <CardDescription>The station to use when no other rules match.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={routing.defaultStation}
              onValueChange={(val) => setRouting(r => r ? {...r, defaultStation: val} : null)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a default station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Routing by Product</CardTitle>
                    <CardDescription>Override routing for specific products. This has the highest priority.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {Object.entries(routing.byProduct).map(([productId, stationId]) => (
                       <div key={productId} className="flex items-center gap-4">
                           <span className="flex-1 font-medium">{products.find(p=>p.id === productId)?.name || productId}</span>
                           <Select value={stationId} onValueChange={(val) => setRouting(r => r ? {...r, byProduct: {...r.byProduct, [productId]: val}} : null)}>
                               <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                               <SelectContent>{stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                           </Select>
                            <Button variant="ghost" size="icon" onClick={() => setRouting(r => {
                                if (!r) return null;
                                const newByProduct = {...r.byProduct};
                                delete newByProduct[productId];
                                return {...r, byProduct: newByProduct};
                            })}>
                                <Trash2 className="w-4 h-4 text-destructive"/>
                            </Button>
                       </div>
                   ))}
                   <Select onValueChange={(val) => setRouting(r => r ? {...r, byProduct: {...r.byProduct, [val]: routing.defaultStation}} : null)}>
                       <SelectTrigger><SelectValue placeholder="Add a product override..."/></SelectTrigger>
                       <SelectContent>
                           {products.filter(p => !routing.byProduct[p.id]).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                       </SelectContent>
                   </Select>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Routing by Category</CardTitle>
                    <CardDescription>Set a default station for all items in a category.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                   {Object.entries(routing.byCategory).map(([catId, stationId]) => (
                       <div key={catId} className="flex items-center gap-4">
                           <span className="flex-1 font-medium">{categories.find(c=>c.id === catId)?.name || catId}</span>
                           <Select value={stationId} onValueChange={(val) => setRouting(r => r ? {...r, byCategory: {...r.byCategory, [catId]: val}} : null)}>
                               <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                               <SelectContent>{stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                           </Select>
                            <Button variant="ghost" size="icon" onClick={() => setRouting(r => {
                                if (!r) return null;
                                const newByCategory = {...r.byCategory};
                                delete newByCategory[catId];
                                return {...r, byCategory: newByCategory};
                            })}>
                                <Trash2 className="w-4 h-4 text-destructive"/>
                            </Button>
                       </div>
                   ))}
                   <Select onValueChange={(val) => setRouting(r => r ? {...r, byCategory: {...r.byCategory, [val]: routing.defaultStation}} : null)}>
                       <SelectTrigger><SelectValue placeholder="Add a category rule..."/></SelectTrigger>
                       <SelectContent>
                           {categories.filter(c => !routing.byCategory[c.id]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                       </SelectContent>
                   </Select>
                </CardContent>
            </Card>
        </div>


        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={fetchData}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </main>
    </div>
  );
}
