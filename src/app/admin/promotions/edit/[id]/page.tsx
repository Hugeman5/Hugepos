
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type PromotionRule } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PromotionEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [promo, setPromo] = useState<Partial<PromotionRule>>({});
  const [isLoading, setIsLoading] = useState(true);
  const isNew = params.id === 'new';

  const fetchPromo = useCallback(async () => {
    if (isNew) {
      setPromo({
        name: '',
        type: 'percent',
        value: 10,
        scope: 'order',
        targetIds: [],
        active: true,
        bxgy: { buyQty: 0, getQty: 0, appliesTo: 'same' },
        time: { days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "23:59", tz: "Africa/Johannesburg" },
        eligibility: { roles: ['cashier', 'waiter', 'manager'], minSpendCents: 0, minQty: 0 },
        stacking: 'compatible'
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/promotions`);
      const promos: PromotionRule[] = await res.json();
      const current = promos.find(p => p.id === params.id);
      if (current) {
        setPromo(current);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Promotion not found.' });
        router.push('/admin/promotions');
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [isNew, params.id, router, toast]);

  useEffect(() => {
    fetchPromo();
  }, [fetchPromo]);

  const handleSave = async () => {
    const url = isNew ? '/api/admin/promotions' : `/api/admin/promotions/${params.id}`;
    const method = isNew ? 'POST' : 'PATCH';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save promotion");
      }
      toast({ title: 'Success', description: 'Promotion saved.' });
      router.push('/admin/promotions');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  if (isLoading || !promo) {
    return <AdminLayout title="Loading..."/>;
  }

  return (
    <AdminLayout title={isNew ? 'Create Promotion' : `Edit ${promo.name}`}>
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'New Promotion Rule' : 'Edit Promotion Rule'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label>Name</Label>
                    <Input value={promo.name || ''} onChange={e => setPromo(p => ({ ...p, name: e.target.value }))} />
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
                 <div>
                    <Label>Type</Label>
                    <Select value={promo.type} onValueChange={v => setPromo(p => ({ ...p, type: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percent">Percentage Off</SelectItem>
                            <SelectItem value="amount">Fixed Amount Off</SelectItem>
                            <SelectItem value="bxgy">Buy X Get Y</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>{promo.type === 'percent' ? 'Percentage' : 'Amount (cents)'}</Label>
                    <Input type="number" value={promo.value || 0} onChange={e => setPromo(p => ({ ...p, value: parseInt(e.target.value, 10) }))} />
                </div>
                <div>
                    <Label>Scope</Label>
                    <Select value={promo.scope} onValueChange={v => setPromo(p => ({ ...p, scope: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="order">Entire Order</SelectItem>
                            <SelectItem value="category">Specific Category</SelectItem>
                            <SelectItem value="item">Specific Item</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* TODO: Add more complex UI for time, eligibility, etc. */}

            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => router.push('/admin/promotions')}>Cancel</Button>
                <Button onClick={handleSave}>Save Promotion</Button>
            </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
