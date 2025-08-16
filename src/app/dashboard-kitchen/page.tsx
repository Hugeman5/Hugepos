
'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { type Order } from '@/lib/data';
import KitchenOrderCard from '@/components/kitchen-order-card';
import { useToast } from '@/hooks/use-toast';

export default function KitchenDashboardPage() {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/orders?status=pending');
                if (!res.ok) {
                    throw new Error('Failed to fetch orders');
                }
                const allOrders: Order[] = await res.json();
                
                // The API returns all orders, so we filter for pending client-side for now
                // A better API would support `status=pending` directly
                const pending = allOrders.filter(o => o.status === 'pending');

                setPendingOrders(pending);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch kitchen orders.',
                });
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
        
        // Optional: poll for new orders every 15 seconds
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);

    }, [toast]);


  return (
    <div className="flex h-screen w-full flex-col">
      <DashboardHeader title="Kitchen Display System" userName="Chef Mike" userRole="Kitchen" />
      <main className="flex-1 p-4 md:p-6 bg-muted/20 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
             <div className="col-span-full h-[60vh] flex items-center justify-center">
                <p className="text-muted-foreground">Loading orders...</p>
            </div>
        ) : pendingOrders.length > 0 ? (
            pendingOrders
                .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((order) => (
                    <KitchenOrderCard key={order.id} order={order} />
                ))
        ) : (
            <div className="col-span-full h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">All orders completed!</h2>
                    <p className="text-muted-foreground">Waiting for new orders...</p>
                </div>
            </div>
        )}
        </div>
      </main>
    </div>
  );
}
