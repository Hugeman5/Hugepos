
'use client';
import { useState, useEffect } from 'react';
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

export default function NewPurchaseOrderPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSuppliers() {
      const res = await fetch('/api/suppliers');
      setSuppliers(await res.json());
    }
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!selectedSupplier) return;
    async function fetchItems() {
      setIsLoading(true);
      const res = await fetch(`/api/supplier-items?supplierId=${selectedSupplier?.id}`);
      setSupplierItems(await res.json());
      setIsLoading(false);
    }
    fetchItems();
  }, [selectedSupplier]);

  const handleQtyChange = (itemId: string, qty: number) => {
    setQtyById(prev => ({ ...prev, [itemId]: Math.max(0, qty) }));
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
      router.push(`/admin/purchasing/orders/${po.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsCreating(false);
    }
  };

  const [lines, totals] = (async () => {
    if (!supplierItems.length) return [[], { exVat: 0, vat: 0, incVat: 0 }];
    const poLines = await toPOLines(supplierItems, qtyById);
    return [poLines, calculateTotals(poLines)];
  })();

  return (
    <AdminLayout title="New Purchase Order">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    <TableHead>Price (Ex. VAT)</TableHead>
                    <TableHead>Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={4}>Loading items...</TableCell></TableRow> : supplierItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.packSize} {item.uom}</TableCell>
                      <TableCell>{formatMoney(item.priceExVat)}</TableCell>
                      <TableCell>
                        <Input type="number" className="w-20" value={qtyById[item.id] || ''} onChange={e => handleQtyChange(item.id, parseInt(e.target.value, 10))} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                    <div className="flex justify-between"><span>Subtotal (Ex. VAT)</span><span>{formatMoney(totals.exVat)}</span></div>
                    <div className="flex justify-between"><span>VAT</span><span>{formatMoney(totals.vat)}</span></div>
                    <div className="flex justify-between font-bold"><span>Total (Inc. VAT)</span><span>{formatMoney(totals.incVat)}</span></div>
                </div>
              </div>
              <Input placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              <Button onClick={handleCreatePO} disabled={isCreating || Object.keys(qtyById).length === 0}>
                {isCreating ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
