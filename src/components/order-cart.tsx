'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function OrderCart() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Espresso', price: 2.5, quantity: 2 },
    { id: 4, name: 'Croissant', price: 2.0, quantity: 1 },
  ]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Current Order</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full">
          Complete Payment
        </Button>
      </CardFooter>
    </Card>
  );
}
