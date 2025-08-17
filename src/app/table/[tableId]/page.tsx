
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard-header';
import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import {
  type Category,
  type MenuItem as Product,
  type Modifier,
  type CartLine,
  type ServiceCheck,
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { type Menu } from '@/lib/menuRepo';

export default function TableOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [menuData, setMenuData] = useState<Menu | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [check, setCheck] = useState<ServiceCheck | null>(null);
  const [qtyBuffer, setQtyBuffer] = useState<number>(1);
  const { toast } = useToast();
  
  const user = { uid: 'jwaiter', name: 'Jane Waiter' }; // Mock user

  const fetchCheckAndOrder = useCallback(async () => {
    if (!tableId) return;
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
      setCart(orderData.lines || []);

    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }, [tableId, toast, router]);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/admin/menu');
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data = await res.json();
        setMenuData(data);
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
    }
    fetchMenu();
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

  const handleAddToCart = (product: Product, mods: CartLine['mods']) => {
    setCart((prevCart) => {
      const existingLine = prevCart.find(line => 
        line.productId === product.id &&
        JSON.stringify(line.mods) === JSON.stringify(mods)
      );

      if (existingLine) {
        return prevCart.map(line =>
            line.id === existingLine.id ? { ...line, qty: line.qty + qtyBuffer } : line
        );
      } else {
         const newLine: CartLine = {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            qty: qtyBuffer,
            mods,
            subtotal: 0,
            tax: 0,
            total: 0
        };
        return [...prevCart, newLine];
      }
    });
    setQtyBuffer(1);
  };

  const handleUpdateCart = (lines: CartLine[]) => {
    setCart(lines);
  };
  
  if (!menuData || !check) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading Table {tableId} Order...
      </div>
    );
  }
  
  const productsByCategory = menuData.items.reduce((acc, item) => {
    const catId = item.catId || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="flex h-screen w-full flex-col bg-muted/40">
      <DashboardHeader
        title={`Table ${check.tableId}`}
        userName={user.name}
        userRole="Waiter"
      />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 lg:gap-8 lg:p-6 overflow-hidden">
        <div className="md:col-span-2 h-full flex flex-col min-h-0">
          <ProductGrid
            categories={menuData.categories.filter(c=>c.active)}
            productsByCategory={productsByCategory}
            allModifiers={[]}
            onAddToCart={handleAddToCart}
            qtyBuffer={qtyBuffer}
          />
        </div>
        <div className="md:col-span-1 h-full flex flex-col min-h-0">
          <OrderCart cartLines={cart} onUpdateCart={handleUpdateCart} user={user} />
        </div>
      </main>
    </div>
  );
}
