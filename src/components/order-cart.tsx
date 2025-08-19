

'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { type Order, type Shift, type ServiceCheck, type OrderLine } from '@/lib/data';
import { PlusCircle, MinusCircle, ShoppingCart, Trash2, CreditCard, Landmark, AlertCircle, FileDown, Mail, Printer, GitCommitHorizontal } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';

type OrderCartProps = {
    order: Order;
    check?: ServiceCheck;
    onOrderUpdate: (order: Order) => void;
    user: { uid: string, name: string };
    settings: Settings;
    openShift: Shift | null;
    onNewOrder: () => void;
    onSplitClick?: () => void;
};

export default function OrderCart({ order, check, onOrderUpdate, user, settings, openShift, onNewOrder, onSplitClick }: OrderCartProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'cash'>('card');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [last4, setLast4] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isPostPayment, setIsPostPayment] = useState(false);
  
  const { toast } = useToast();
  
  const money = (value: number) => {
    if (!settings) return `...`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };


  const handleUpdateQuantity = async (lineId: string, delta: number) => {
    const line = order.lines.find(l => l.lineId === lineId);
    if (!line) return;

    const newQty = line.qty + delta;
    if (newQty < 0) return; // Prevent negative quantity

    try {
        const res = await fetch('/api/orders/line', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id, lineId, qty: newQty })
        });
        if (!res.ok) throw new Error('Failed to update quantity');
        const updatedOrder = await res.json();
        onOrderUpdate(updatedOrder.order);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  const handleRemoveLine = async (lineId: string) => {
     await handleUpdateQuantity(lineId, -Infinity);
  }
  
  const handlePay = async () => {
    if (!order.totals || !openShift) return;
    setIsPaying(true);
    try {
        const paymentsPayload = [{
            type: paymentType,
            amount: order.totals.total,
            ...(paymentType === 'card' && { last4 }),
            ...(paymentType === 'cash' && { tendered: parseFloat(tenderedAmount) })
        }];
        
        const payRes = await fetch(`/api/orders/${order.id}/pay`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ payments: paymentsPayload, user }),
        });
        
        if (!payRes.ok) {
            const errorData = await payRes.json();
            throw new Error(errorData.message || 'Payment failed');
        }

        const paymentResult = await payRes.json();
        const orderData = await fetch(`/api/orders/${paymentResult.orderId}`).then(r => r.json());
        setCreatedOrder(orderData);
        setIsPostPayment(true);

        toast({ 
            title: `Order ${orderData.number} Paid`,
            description: `${paymentResult.inventoryMovesCount} inventory items updated.`,
        });
        
        return true;

    } catch (e) {
        toast({ variant: 'destructive', title: 'Payment Error', description: (e as Error).message });
        return false;
    } finally {
        setIsPaying(false);
    }
  };

  const handleSendToKitchen = async () => {
    try {
      const res = await fetch('/api/orders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!res.ok) throw new Error('Failed to send order.');
      const result = await res.json();
      toast({ title: 'Order Sent', description: 'New items sent to the kitchen.' });
      onOrderUpdate(result.order);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }
  
  const isPaymentValid = () => {
      if (!openShift) return false;
      if (paymentType === 'cash') {
          return parseFloat(tenderedAmount) >= (order.totals?.total || 0);
      }
      if (paymentType === 'card') {
          return last4.length === 4 && /^\d{4}$/.test(last4);
      }
      return false;
  }
  
  const renderNoShiftOverlay = () => {
      if (openShift) return null;
      return (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4 z-10">
          <AlertCircle className="h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-xl font-semibold text-white">No Open Register</h3>
          <p className="text-yellow-200 mt-2 mb-4">A register shift must be opened before processing sales.</p>
          <Button asChild>
            <Link href="/register/open">Open Register</Link>
          </Button>
        </div>
      )
  }
  
  const PostPaymentActions = () => (
      <div className="w-full text-center p-4 space-y-4">
          <h3 className="font-semibold text-lg">Order #{createdOrder?.number} Completed</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button variant="secondary"><Printer className="mr-2"/> Print Receipt</Button>
            <Button variant="secondary"><Mail className="mr-2"/> Email Receipt</Button>
            <Button variant="secondary"><FileDown className="mr-2"/> Download PDF</Button>
          </div>
          <Button onClick={onNewOrder} className="w-full">New Order</Button>
      </div>
  );

  return (
    <Card className="h-full flex flex-col relative">
      {renderNoShiftOverlay()}
      <CardHeader>
        <h2 className="text-xl font-semibold flex items-center gap-2 font-headline">
          <ShoppingCart className="h-6 w-6" /> Current Order #{order.number}
        </h2>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {order.lines.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            <p>Click on products to add them to the order.</p>
          </div>
        ) : isPostPayment ? (
          <PostPaymentActions />
        ) : (
          <div className="space-y-4">
            {(order.lines || []).map((line) => (
              <div key={line.lineId} className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">{line.qty}x {line.name}</p>
                   {line.mods && line.mods.length > 0 && <p className="text-sm text-muted-foreground">{line.mods.map(m => m.optionName).join(', ')}</p>}
                   {line.lineTotal != null && <p className="text-sm font-semibold">{money(line.lineTotal)}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdateQuantity(line.lineId, -1)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdateQuantity(line.lineId, 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleRemoveLine(line.lineId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <div className="flex flex-col gap-4 mt-auto border-t p-4">
        {order.totals && !isPostPayment && (
            <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{money(order.totals?.subtotal)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{money(order.totals?.tax)}</span>
                </div>
                <div className="w-full flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>{money(order.totals?.total)}</span>
                </div>
            </div>
        )}
        {!isPostPayment &&
            <div className="w-full grid grid-cols-2 gap-2">
                {onSplitClick && 
                <Button className="w-full" size="lg" variant="secondary" onClick={onSplitClick} disabled={order.lines.length === 0}>
                    <GitCommitHorizontal className="mr-2"/> Split
                </Button>
                }
                <Button className="w-full" size="lg" variant="secondary" onClick={handleSendToKitchen} disabled={order.lines.length === 0}>Send</Button>
                <Dialog onOpenChange={(open) => !open && setIsPostPayment(false)}>
                    <DialogTrigger asChild>
                        <Button className="w-full col-span-2" size="lg" disabled={order.lines.length === 0 || !openShift}>
                            Pay
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Complete Payment</DialogTitle>
                        </DialogHeader>
                        {isPostPayment ? <PostPaymentActions/> : (
                            <>
                            <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="card"><CreditCard className="mr-2"/>Card</TabsTrigger>
                                    <TabsTrigger value="cash"><Landmark className="mr-2"/>Cash</TabsTrigger>
                                </TabsList>
                                <TabsContent value="card" className="mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="last4">Last 4 Digits of Card</Label>
                                        <Input id="last4" value={last4} onChange={(e) => setLast4(e.target.value)} maxLength={4} placeholder="1234" />
                                    </div>
                                </TabsContent>
                                <TabsContent value="cash" className="mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tendered">Amount Tendered</Label>
                                        <Input id="tendered" type="number" value={tenderedAmount} onChange={(e) => setTenderedAmount(e.target.value)} placeholder={order.totals?.total?.toFixed(2) ?? '0.00'} />
                                    </div>
                                    {parseFloat(tenderedAmount) >= (order.totals?.total || 0) && (
                                        <div className="text-lg font-semibold mt-4">
                                            Change Due: {money(parseFloat(tenderedAmount) - (order.totals?.total || 0))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handlePay} disabled={!isPaymentValid() || isPaying}>
                                    {isPaying ? 'Processing...' : `Confirm & Pay ${money(order.totals?.total ?? 0)}`}
                                </Button>
                            </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        }
      </div>
    </Card>
  );
}
