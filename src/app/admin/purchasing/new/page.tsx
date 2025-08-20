

'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Supplier } from '@/lib/repos/suppliersRepo';
import { type SupplierItem } from '@/lib/repos/supplierItemsRepo';
import { toPOLines, totals as calculateTotals } from '@/lib/purchasing';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';

export default function NewPurchaseOrderPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState<Settings|null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const money = (value: number) => {
    if (!settings) return `...`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const [suppliersRes, settingsRes] = await Promise.all([
            fetch('/api/suppliers', { cache: 'no-store' }),
            fetch('/api/settings')
        ]);
        if (!suppliersRes.ok) throw new Error("Failed to fetch suppliers");
        setSuppliers(await suppliersRes.json());
        if (!settingsRes.ok) throw new Error("Failed to fetch settings");
        setSettings(await settingsRes.json());
      } catch(e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedSupplier) {
      setSupplierItems([]);
      return;
    }
    async function fetchItems() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/supplier-items?supplierId=${selectedSupplier?.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch supplier items");
        setSupplierItems(await res.json());
      } catch(e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, [selectedSupplier]);

  const handleQtyChange = (itemId: string, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    setQtyById(prev => ({ ...prev, [itemId]: isNaN(qty) ? 0 : Math.max(0, qty) }));
  };

  const handleCreatePO = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: selectedSupplier?.id, qtyById, notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const po = await res.json();
      toast({ title: 'Success', description: `PO ${po.id} created.` });
      router.push(`/admin/purchasing`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsCreating(false);
    }
  };

  const poLines = useMemo(() => {
    if (!supplierItems.length || !settings) return [];
    const filteredItems = supplierItems.filter(item => qtyById[item.id] > 0);
    return toPOLines(filteredItems, qtyById, settings);
  }, [supplierItems, qtyById, settings]);

  const totals = useMemo(() => calculateTotals(poLines), [poLines]);

  return (
    <AdminLayout title="New Purchase Order">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-destructive bg-destructive/10 p-4 rounded-md">{error}</div>}
          <Select onValueChange={id => setSelectedSupplier(suppliers.find(s => s.id === id) || null)}>
            <SelectTrigger><SelectValue placeholder="Select a supplier..." /></SelectTrigger>
            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>

          {selectedSupplier && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Pack Size</TableHead>
                    <TableHead className="text-right">Price (Ex. VAT)</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={4} className="text-center">Loading items...</TableCell></TableRow> : supplierItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.packSize} {item.uom}</TableCell>
                      <TableCell className="text-right font-mono">{money(item.priceExVat)}</TableCell>
                      <TableCell>
                        <Input type="number" className="w-20 text-center" value={qtyById[item.id] || ''} onChange={e => handleQtyChange(item.id, e.target.value)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <div className="w-80 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal (Ex. VAT)</span><span className="font-mono">{money(totals.exVat)}</span></div>
                    <div className="flex justify-between"><span>VAT (15%)</span><span className="font-mono">{money(totals.vat)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total (Inc. VAT)</span><span className="font-mono">{money(totals.incVat)}</span></div>
                </div>
              </div>
              <Input placeholder="Optional notes for this PO..." value={notes} onChange={e => setNotes(e.target.value)} />
              <Button onClick={handleCreatePO} disabled={isCreating || Object.values(qtyById).every(q => q === 0)}>
                {isCreating ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
