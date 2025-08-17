
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import {
  type Category,
  type Product,
  type Modifier,
  type Tax,
  type CartLine,
  type Shift
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type MenuData = {
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
  modifiers: Modifier[];
  taxes: Tax[];
};

export default function CashierDashboardPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [qtyBuffer, setQtyBuffer] = useState<number>(1);
  const [user, setUser] = useState({ uid: 'jcashier', name: 'John Cashier' });
  const [shiftStatus, setShiftStatus] = useState<any>(null);
  const { toast } = useToast();
  const scanBuffer = useRef('');
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data = await res.json();
        setMenuData(data);
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
    }
    
    async function fetchShiftStatus() {
        try {
            const res = await fetch('/api/register/open-shift');
            if(res.ok) {
                const data = await res.json();
                setShiftStatus(data);
            }
        } catch(e) {
            console.error("Could not fetch shift status", e);
        }
    }
    
    fetchMenu();
    fetchShiftStatus();
  }, [toast]);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
        const allProducts = Object.values(menuData?.productsByCategory || {}).flat();
        const product = allProducts.find(p => p.barcode === barcode);

        if (product) {
            handleAddToCart(product, []);
            toast({ title: 'Item Added', description: `Scanned: ${product.name}` });
        } else {
            toast({ variant: 'destructive', title: 'Not Found', description: `No product found for barcode: ${barcode}` });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Scan Error', description: (error as Error).message });
    }
  }, [menuData, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  if (!menuData) {
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
        userRole="Cashier"
        shiftStatus={shiftStatus}
      />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 lg:gap-8 lg:p-6 overflow-hidden">
        <div className="md:col-span-2 h-full flex flex-col min-h-0">
          <ProductGrid
            categories={menuData.categories}
            productsByCategory={menuData.productsByCategory}
            allModifiers={menuData.modifiers}
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
