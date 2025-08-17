
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type PromotionRule } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { getSettings, type Settings } from '@/lib/settingsRepo';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const money = (value: number) => {
    if (!settings) return `R ${value.toFixed(2)}`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      if (!res.ok) throw new Error('Failed to load promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
        const res = await fetch(`/api/admin/promotions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active })
        });
        if (!res.ok) throw new Error('Failed to update status');
        toast({ title: 'Success', description: 'Promotion status updated.' });
        fetchData();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }


  if (isLoading || !settings) {
    return <AdminLayout title="Promotions">Loading...</AdminLayout>;
  }

  return (
    <AdminLayout title="Promotions">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Promotion Rules</h1>
          <p className="text-brand-mute">Create and manage discounts and special offers.</p>
        </div>
        <Button asChild>
          <Link href="/admin/promotions/edit/new"><PlusCircle className="mr-2"/> New Promotion</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Promotions</CardTitle>
          <CardDescription>
            These are the promotions currently configured in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <div className="grid grid-cols-5 p-2 font-semibold border-b bg-muted/50">
              <div>Name</div>
              <div>Type</div>
              <div>Scope</div>
              <div>Value</div>
              <div className="text-right">Active</div>
            </div>
            {promotions.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">No promotions created yet.</p>
            ) : promotions.map(promo => (
              <Link href={`/admin/promotions/edit/${promo.id}`} key={promo.id} className="grid grid-cols-5 p-2 border-b items-center hover:bg-muted/50 cursor-pointer">
                  <div className="font-medium">{promo.name}</div>
                  <div><Badge variant="secondary" className="capitalize">{promo.type}</Badge></div>
                  <div><Badge variant="secondary" className="capitalize">{promo.scope}</Badge></div>
                  <div>
                    {promo.type === 'percent' ? `${promo.value}%` : 
                     promo.type === 'amount' ? money(promo.value / 100) :
                     `Buy ${promo.bxgy.buyQty}, Get ${promo.bxgy.getQty}`
                    }
                  </div>
                  <div className="text-right">
                    <Switch
                        checked={promo.active}
                        onCheckedChange={(checked) => handleToggleActive(promo.id, checked)}
                        onClick={(e) => e.stopPropagation()} // Prevent link navigation
                    />
                  </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
