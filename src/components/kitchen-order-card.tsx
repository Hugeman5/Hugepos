'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type Order } from '@/lib/data';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

type KitchenOrderCardProps = {
  order: Order;
};

const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " min ago";
    }
    return Math.floor(seconds) + " sec ago";
};


export default function KitchenOrderCard({ order }: KitchenOrderCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [time, setTime] = useState(timeSince(order.createdAt))
  const { toast } = useToast()

  useEffect(() => {
    const timer = setInterval(() => {
        setTime(timeSince(order.createdAt))
    }, 5000);
    return () => clearInterval(timer);
  }, [order.createdAt]);


  const handleComplete = () => {
    setIsCompleted(true);
    toast({
        title: `Order ${order.id} Completed!`,
        description: "The order is ready for pickup.",
    })
  };
  
  if (isCompleted) return null;

  return (
    <Card className={cn('transition-all flex flex-col', isCompleted ? 'opacity-50' : 'opacity-100')}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className='font-headline'>{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</span>
          <span className="text-sm font-mono text-muted-foreground">{order.id}</span>
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-primary font-semibold">
            <Clock className="h-3 w-3"/> {time}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
            {order.items.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                    <span className="font-semibold">{item.quantity}x</span>
                    <span className="flex-1 ml-2">{item.product.name}</span>
                </li>
            ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full" onClick={handleComplete}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Completed
        </Button>
      </CardFooter>
    </Card>
  );
}
