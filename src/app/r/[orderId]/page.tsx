
'use server';
import { getOrder } from '@/lib/ordersRepo';
import { verifyReceipt } from '@/lib/signing';
import { formatMoney } from '@/lib/money';
import { getSettings } from '@/lib/settingsRepo';
import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function PublicReceiptPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { orderId } = params;
  const { sig, ts, total } = searchParams;

  if (typeof sig !== 'string' || typeof ts !== 'string' || typeof total !== 'string') {
    return notFound();
  }

  const isValid = await verifyReceipt({
    orderId,
    totalCents: parseInt(total, 10),
    ts,
    sig,
  });

  if (!isValid) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted">
            <Card>
                <div className="p-4 border-b border-brand-line">
                    <h2 className="text-xl font-semibold">Invalid Link</h2>
                    <p className="text-brand-mute">This receipt link is invalid or may have expired.</p>
                </div>
            </Card>
        </main>
    )
  }

  const [order, settings] = await Promise.all([getOrder(orderId), getSettings()]);

  if (!order) {
    return notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted">
        <Card className="w-full max-w-2xl">
            <div className="p-4 border-b border-brand-line">
                <h2 className="text-xl font-semibold">Receipt #{order.number}</h2>
                <p className="text-brand-mute">
                    {new Date(order.ts).toLocaleString(settings.locale)}
                </p>
            </div>
            <div className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.lines.map(line => (
                            <TableRow key={line.lineId}>
                                <TableCell>{line.name}</TableCell>
                                <TableCell className="text-center">{line.qty}</TableCell>
                                <TableCell className="text-right">{formatMoney(line.lineTotal, settings.currency, settings.locale)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 space-y-2 text-right">
                    <p>Subtotal: {formatMoney(order.totals.subtotal, settings.currency, settings.locale)}</p>
                    <p>Tax: {formatMoney(order.totals.tax, settings.currency, settings.locale)}</p>
                    <p className="font-bold text-lg">Total: {formatMoney(order.totals.total, settings.currency, settings.locale)}</p>
                </div>
            </div>
        </Card>
    </main>
  );
}
