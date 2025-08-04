'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type OrderItem, type Product } from '@/lib/data';
import { PlusCircle, MinusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function OrderCart() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  const handleAddItem = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };
  
  useEffect(() => {
    const addProductToCart = (event: CustomEvent<Product>) => {
      handleAddItem(event.detail);
    };

    document.addEventListener('addToCart', addProductToCart as EventListener);
    
    return () => {
      document.removeEventListener('addToCart', addProductToCart as EventListener);
    };
  }, []);
  
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const submitOrder = () => {
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Cannot submit empty order",
        description: "Please add items to the cart first.",
      });
      return;
    }
    console.log("Submitting order:", { items, total });
    toast({
        title: "Order Submitted!",
        description: `Total: $${total.toFixed(2)}.`,
    });
    setItems([]);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <ShoppingCart className="h-6 w-6" /> Current Order
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            <p>Click on products to add them to the order.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="font-medium w-4 text-center">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 mt-auto border-t pt-4">
        <div className="w-full flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <Button className="w-full" size="lg" onClick={submitOrder} disabled={items.length === 0}>
          Submit Order
        </Button>
      </CardFooter>
    </Card>
  );
}
