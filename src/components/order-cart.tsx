
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type CartLine, type Order, type OrderTotal } from '@/lib/data';
import { PlusCircle, MinusCircle, ShoppingCart, Trash2, CreditCard, Landmark } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type OrderCartProps = {
    cartLines: CartLine[];
    onUpdateCart: (lines: CartLine[]) => void;
    user: { uid: string, name: string };
};

export default function OrderCart({ cartLines, onUpdateCart, user }: OrderCartProps) {
  const [totals, setTotals] = useState<OrderTotal | null>(null);
  const [enrichedLines, setEnrichedLines] = useState<CartLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'cash'>('card');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [last4, setLast4] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const calculateTotals = async () => {
      if (cartLines.length === 0) {
        setTotals(null);
        setEnrichedLines([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/price/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: cartLines }),
        });
        if (!res.ok) throw new Error('Failed to calculate totals');
        const data = await res.json();
        setTotals(data);
        setEnrichedLines(data.lines);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not calculate order totals.' });
      } finally {
        setIsLoading(false);
      }
    };
    calculateTotals();
  }, [cartLines, toast]);

  const handleUpdateQuantity = (lineId: string, delta: number) => {
    const updatedLines = cartLines.map(line => 
      line.id === lineId ? { ...line, qty: Math.max(0, line.qty + delta) } : line
    ).filter(line => line.qty > 0);
    onUpdateCart(updatedLines);
  };
  
  const handleRemoveLine = (lineId: string) => {
      const updatedLines = cartLines.filter(line => line.id !== lineId);
      onUpdateCart(updatedLines);
  }

  const handlePay = async () => {
    if (!totals) return;
    setIsPaying(true);
    try {
        // 1. Create the DRAFT order
        const createOrderRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, items: cartLines })
        });
        if (!createOrderRes.ok) throw new Error('Failed to create order');
        const orderData: Order = await createOrderRes.json();
        setCreatedOrder(orderData);

        // 2. Pay for the order
        const payBody = {
            type: paymentType,
            amount: totals.total,
            user,
            ...(paymentType === 'card' && { last4 }),
            ...(paymentType === 'cash' && { tendered: parseFloat(tenderedAmount) })
        };
        
        const payRes = await fetch(`/api/orders/${orderData.id}/pay`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payBody),
        });
        
        if (!payRes.ok) {
            const errorData = await payRes.json();
            throw new Error(errorData.message || 'Payment failed');
        }

        const paymentResult = await payRes.json();

        toast({ 
            title: `Order ${orderData.number} Paid`,
            description: `${paymentResult.inventoryMovesCount} inventory items updated.`,
        });

        // Open receipt in new tab/window
        window.open(`/receipt/${orderData.id}`, '_blank');
        
        // Reset state
        onUpdateCart([]);
        setCreatedOrder(null);
        setTenderedAmount('');
        setLast4('');
        return true; // Indicate success to close dialog

    } catch (e) {
        toast({ variant: 'destructive', title: 'Payment Error', description: (e as Error).message });
        return false;
    } finally {
        setIsPaying(false);
    }
  };
  
  const isPaymentValid = () => {
      if (paymentType === 'cash') {
          return parseFloat(tenderedAmount) >= (totals?.total || 0);
      }
      if (paymentType === 'card') {
          return last4.length === 4 && /^\d{4}$/.test(last4);
      }
      return false;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <ShoppingCart className="h-6 w-6" /> Current Order
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {cartLines.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            <p>Click on products to add them to the order.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedLines.map((line) => (
              <div key={line.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">{line.productName}</p>
                   {line.modsSummary && <p className="text-sm text-muted-foreground">{line.modsSummary}</p>}
                   {line.total != null && <p className="text-sm font-semibold">${line.total.toFixed(2)}</p>}
                </div>
                <div className="flex items-center gap-2">
                   <span className="font-medium w-6 text-center">{line.qty}x</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdateQuantity(line.id, -1)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdateQuantity(line.id, 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleRemoveLine(line.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 mt-auto border-t p-4">
        {isLoading && <p>Calculating...</p>}
        {totals && !isLoading && (
            <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${totals.tax.toFixed(2)}</span>
                </div>
                <div className="w-full flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                </div>
            </div>
        )}
        <div className="w-full grid grid-cols-2 gap-2">
            <Button className="w-full" size="lg" variant="secondary" disabled>Hold</Button>

            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full" size="lg" disabled={cartLines.length === 0 || isLoading}>
                        Pay
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Payment</DialogTitle>
                    </DialogHeader>
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
                                <Input id="tendered" type="number" value={tenderedAmount} onChange={(e) => setTenderedAmount(e.target.value)} placeholder={totals?.total.toFixed(2)} />
                            </div>
                            {parseFloat(tenderedAmount) >= (totals?.total || 0) && (
                                <div className="text-lg font-semibold mt-4">
                                    Change Due: ${(parseFloat(tenderedAmount) - (totals?.total || 0)).toFixed(2)}
                                </div>
                            )}
                         </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button onClick={async () => {
                           const success = await handlePay();
                           if(success) {
                             // The button is inside a DialogClose, so we need to manually close it
                             document.querySelector('[data-radix-dialog-content] [aria-label="Close"]')?.dispatchEvent(new Event('click'));
                           }
                        }} disabled={!isPaymentValid() || isPaying}>
                            {isPaying ? 'Processing...' : `Confirm & Pay $${totals?.total.toFixed(2)}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
