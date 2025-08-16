
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type CartLine, type OrderTotal, type Product } from '@/lib/data';
import { PlusCircle, MinusCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
// Removed: import { payOrder } from '@/lib/actions'; - This will be part of the next step

type OrderCartProps = {
    cartLines: CartLine[];
    onUpdateCart: (lines: CartLine[]) => void;
};

export default function OrderCart({ cartLines, onUpdateCart }: OrderCartProps) {
  const [totals, setTotals] = useState<OrderTotal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const calculateTotals = async () => {
      if (cartLines.length === 0) {
        setTotals(null);
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

  const submitOrder = async () => {
    toast({ title: "Payment flow not implemented yet." });
    // Payment logic will be added in the next step.
  };

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
            {cartLines.map((line) => (
              <div key={line.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">{line.productName}</p>
                   {line.modsSummary && <p className="text-sm text-muted-foreground">{line.modsSummary}</p>}
                   <p className="text-sm font-semibold">${line.total?.toFixed(2)}</p>
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
            <Button className="w-full" size="lg" onClick={submitOrder} disabled={cartLines.length === 0}>
                Pay
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
