
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard-header';
import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import {
  type ServiceCheck,
  type Order,
} from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { type Menu, type MenuItem, type CartLineMod } from '@/lib/menuRepo';
import { SplitView } from '@/components/waiter/SplitView';
import { Button } from '@/components/ui/Button';
import { GitCommitHorizontal } from 'lucide-react';
import { type Settings } from '@/lib/settingsRepo';


export default function TableOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [menuData, setMenuData] = useState<Menu | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [check, setCheck] = useState<ServiceCheck | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qtyBuffer, setQtyBuffer] = useState<number>(1);
  const [isSplitView, setIsSplitView] = useState(false);
  const { toast } = useToast();
  
  const user = { uid: 'jwaiter', name: 'Jane Waiter' }; // Mock user

  const fetchCheckAndOrder = useCallback(async () => {
    if (!tableId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/service/check/by-table/${tableId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast({ variant: 'destructive', title: 'Error', description: 'This table has no open check. Redirecting...' });
          router.push('/waiter');
          return;
        }
        throw new Error('Failed to fetch check details');
      }
      const checkData = await res.json();
      setCheck(checkData);

      // Fetch the associated order
      const orderRes = await fetch(`/api/orders/${checkData.orderId}`);
      if (!orderRes.ok) throw new Error('Failed to fetch order details');
      const orderData = await orderRes.json();
      setOrder(orderData);

    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [tableId, toast, router]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
         const [menuRes, settingsRes] = await Promise.all([
            fetch('/api/admin/menu'),
            fetch('/api/settings'),
        ]);

        if (!menuRes.ok) throw new Error('Failed to fetch menu');
        setMenuData(await menuRes.json());
        
        if (!settingsRes.ok) throw new Error('Failed to fetch settings');
        setSettings(await settingsRes.json());

      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
    }
    fetchInitialData();
    fetchCheckAndOrder();
  }, [fetchCheckAndOrder, toast]);

  // Keyboard listener for quantity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isNaN(parseInt(e.key))) {
        const num = parseInt(e.key);
        setQtyBuffer((prev) => {
          const newQty = prev === 1 ? num : parseInt(`${prev}${num}`);
          return newQty > 99 ? 99 : newQty;
        });
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        setQtyBuffer(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddToCart = async (product: MenuItem, mods: CartLineMod[]) => {
    if (!order) return;
    try {
      const res = await fetch('/api/orders/add-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          productId: product.id,
          qty: qtyBuffer,
          mods: mods
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add item to order.');
      }
      const updatedOrder = await res.json();
      setOrder(updatedOrder);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
    setQtyBuffer(1);
  };

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrder(updatedOrder);
  };
  
  if (isLoading || !menuData || !check || !order || !settings) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading Table {tableId} Order...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/40">
      <DashboardHeader
        title={`Table ${check.tableId}`}
        userName={user.name}
        userRole="Waiter"
      />
      
      {isSplitView ? (
        <SplitView 
            check={check}
            onClose={() => setIsSplitView(false)}
        />
      ) : (
        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 lg:gap-8 lg:p-6 overflow-hidden">
          <div className="md:col-span-2 h-full flex flex-col min-h-0">
            <ProductGrid
              menu={menuData}
              onAddToCart={handleAddToCart}
              qtyBuffer={qtyBuffer}
              settings={settings}
            />
          </div>
          <div className="md:col-span-1 h-full flex flex-col min-h-0">
            <OrderCart 
                order={order}
                check={check}
                onOrderUpdate={handleOrderUpdate} 
                user={user}
                settings={settings}
                onSplitClick={() => setIsSplitView(true)}
            />
          </div>
        </main>
      )}
    </div>
  );
}
