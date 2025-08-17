
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { type PurchaseOrder } from '@/lib/repos/purchaseOrdersRepo';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';

export default function ViewPurchaseOrderPage() {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const params = useParams();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      try {
        const [poRes, settingsRes] = await Promise.all([
            fetch(`/api/purchase-orders/${params.id}`),
            fetch('/api/settings')
        ]);
        if (!poRes.ok) {
            toast({ variant: 'destructive', title: 'Error', description: 'PO not found' });
            return;
        }
        setPo(await poRes.json());
        setSettings(await settingsRes.json());

      } catch (e) {
          toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) fetchInitialData();
  }, [params.id, toast]);
  
  const money = (value: number) => {
    if (!settings) return `...`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/email`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      if (data.mailtoUrl) {
          window.location.href = data.mailtoUrl;
      }

      toast({ title: 'Success', description: data.message });
      const updatedPoRes = await fetch(`/api/purchase-orders/${params.id}`);
      setPo(await updatedPoRes.json());

    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !po) return <AdminLayout title="Loading PO..."><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={`Purchase Order ${po.id}`}>
      <Card>
        <CardHeader>
          <CardTitle>PO: {po.id}</CardTitle>
          <div>To: {po.supplierName}</div>
          <div>Status: <span className="capitalize font-semibold">{po.status}</span></div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price (Ex.)</TableHead>
                <TableHead>VAT</TableHead>
                <TableHead>Total (Inc.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lines.map(line => (
                <TableRow key={line.itemId}>
                  <TableCell>{line.name}</TableCell>
                  <TableCell>{line.qty}</TableCell>
                  <TableCell>{money(line.priceExVat)}</TableCell>
                  <TableCell>{(line.vatRate * 100).toFixed(0)}%</TableCell>
                  <TableCell>{money(line.lineIncVat)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           <div className="flex justify-end mt-4">
                <div className="w-80 space-y-2">
                    <div className="flex justify-between"><span>Subtotal (Ex. VAT)</span><span>{money(po.totals.exVat)}</span></div>
                    <div className="flex justify-between"><span>VAT</span><span>{money(po.totals.vat)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Total (Inc. VAT)</span><span>{money(po.totals.incVat)}</span></div>
                </div>
            </div>
            {po.notes && <div className="mt-4"><strong>Notes:</strong> {po.notes}</div>}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSendEmail} disabled={isSending}>{isSending ? 'Sending...' : 'Send by Email'}</Button>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}
