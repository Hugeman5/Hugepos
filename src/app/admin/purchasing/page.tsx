
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { type PurchaseOrder } from '@/lib/repos/purchaseOrdersRepo';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    async function fetchPOs() {
      setIsLoading(true);
      try {
        const [poRes, settingsRes] = await Promise.all([
            fetch('/api/purchase-orders'),
            fetch('/api/settings')
        ]);
        
        if (!poRes.ok) throw new Error('Failed to load purchase orders');
        setPos(await poRes.json());

        if (settingsRes.ok) {
            setSettings(await settingsRes.json());
        } else {
            throw new Error("Failed to load settings");
        }

      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPOs();
  }, [toast]);
  
  const money = (value: number) => {
    if (!settings) return '...';
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  }

  return (
    <AdminLayout title="Purchasing">
        <div className="flex justify-end gap-2 mb-4">
            <Button asChild><Link href="/admin/purchasing/suppliers">Manage Suppliers</Link></Button>
            <Button asChild><Link href="/admin/purchasing/new">New Purchase Order</Link></Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>A list of all purchase orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow> : pos.map(po => (
                <TableRow key={po.id}>
                  <TableCell>{po.id}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={po.status === 'sent' ? 'default' : 'secondary'}>{po.status}</Badge></TableCell>
                  <TableCell>{money(po.totals.incVat)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/purchasing/${po.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
