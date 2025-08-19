
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import {
  type Order,
  type Shift,
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { type Menu, type MenuItem, type CartLineMod } from '@/lib/menuRepo';
import { type Settings } from '@/lib/settingsRepo';
import ShiftControls from '@/components/staff/ShiftControls';

// A constant for the cashier register ID. In a real app, this might be dynamic.
const CASHIER_REGISTER_ID = 'checkout_counter';

export default function CashierDashboardPage() {
  const [menuData, setMenuData] = useState<Menu | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [qtyBuffer, setQtyBuffer] = useState<number>(1);
  const [user, setUser] = useState<{ uid: string, name: string, role: string } | null>(null);
  const [openShift, setOpenShift] = useState<Shift | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const { toast } = useToast();
  const scanBuffer = useRef('');
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // On mount, get user from session storage
    const storedSession = sessionStorage.getItem('mockUser');
    if (storedSession) {
        setUser(JSON.parse(storedSession));
    }
  }, []);

  const createNewOrder = useCallback(async () => {
    if (!user) return;
     try {
       const res = await fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ user, items: [], shiftId: openShift?.id }),
       });
       if (!res.ok) throw new Error('Failed to create a new order.');
       const newOrder = await res.json();
       setOrder(newOrder);
     } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
     }
  }, [user, toast, openShift]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [menuRes, shiftRes, settingsRes] = await Promise.all([
            fetch('/api/admin/menu'),
            fetch(`/api/register/open-shift?registerId=${CASHIER_REGISTER_ID}`),
            fetch('/api/settings'),
        ]);

        if (!menuRes.ok) throw new Error('Failed to fetch menu');
        setMenuData(await menuRes.json());
        
        if (shiftRes.ok) setOpenShift(await shiftRes.json());
        else setOpenShift(null);

        if (!settingsRes.ok) throw new Error('Failed to fetch settings');
        setSettings(await settingsRes.json());

      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
    }
    
    fetchInitialData();
  }, [toast]);
  
  useEffect(() => {
    if (user && !order) {
        createNewOrder();
    }
  }, [user, order, createNewOrder]);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!menuData?.items) return;
    try {
        const product = menuData.items.find(p => p.sku === barcode);

        if (product) {
            handleAddToCart(product, []);
            toast({ title: 'Item Added', description: `Scanned: ${product.name}` });
        } else {
            toast({ variant: 'destructive', title: 'Not Found', description: `No product found for barcode: ${barcode}` });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'ScanError', description: (error as Error).message });
    }
  }, [menuData, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      
      if (e.key === 'Enter') {
          if (scanBuffer.current.length > 3) {
              handleBarcodeScan(scanBuffer.current);
          }
          scanBuffer.current = '';
          return;
      }

      if (e.key.length === 1) { 
          scanBuffer.current += e.key;
      } else if (e.key === 'Backspace') {
           scanBuffer.current = scanBuffer.current.slice(0, -1);
      }
      
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      scanTimeout.current = setTimeout(() => {
          scanBuffer.current = '';
      }, 150);


      if (!isNaN(parseInt(e.key))) {
        const num = parseInt(e.key);
        setQtyBuffer((prev) => {
          const newQty = prev === 1 ? num : parseInt(`${prev}${num}`);
          return newQty > 99 ? 99 : newQty;
        });
      } else if (e.key === 'Escape') {
        setQtyBuffer(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScan]);

  const handleAddToCart = async (product: MenuItem, mods: CartLineMod[]) => {
    if (!order) return;
    try {
      const res = await fetch('/api/orders/add-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          itemId: product.id,
          qty: qtyBuffer,
          mods: mods
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add item to order.');
      }
      const {order: updatedOrder} = await res.json();
      onOrderUpdate(updatedOrder);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
    setQtyBuffer(1);
  };
  
  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrder(updatedOrder);
  }

  if (!menuData || !order || !settings || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading POS...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/40">
      <DashboardHeader
        title="Cashier POS"
        userName={user.name}
        userRole={user.role}
        shiftStatus={openShift}
      />
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
            onOrderUpdate={handleOrderUpdate}
            user={user}
            settings={settings}
            openShift={openShift}
            onNewOrder={createNewOrder}
          />
        </div>
      </main>
    </div>
  );
}
