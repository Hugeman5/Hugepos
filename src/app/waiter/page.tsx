'use client';
import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import {
  type Category,
  type Product,
  type Modifier,
  type Tax,
  type CartLine,
} from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Utensils } from 'lucide-react';

const tables = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  status: Math.random() > 0.6 ? 'occupied' : 'available',
}));

type MenuData = {
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
  modifiers: Modifier[];
  taxes: Tax[];
};

export default function WaiterDashboardPage() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [qtyBuffer, setQtyBuffer] = useState<number>(1);
  const [user, setUser] = useState({ uid: 'jwaiter', name: 'Jane Waiter' });

   useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data = await res.json();
        setMenuData(data);
      } catch (e) {
        console.error(e);
        // Add toast notification here in a real app
      }
    }
    fetchMenu();
  }, []);

  // Keyboard listener for quantity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isNaN(parseInt(e.key))) {
        const num = parseInt(e.key);
        setQtyBuffer((prev) => {
          const newQty = prev === 1 ? num : parseInt(`${prev}${num}`);
          return newQty > 99 ? 99 : newQty; // Cap at 99
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
      const newLine: CartLine = {
        id: `${product.id}-${Date.now()}`, // unique id for the line
        productId: product.id,
        qty: qtyBuffer,
        mods,
        subtotal: 0,
        tax: 0,
        total: 0,
      };
      return [...prevCart, newLine];
    });
    setQtyBuffer(1);
  };

  const handleUpdateCart = (lines: CartLine[]) => {
    setCart(lines);
  };

  if (!menuData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading Waiter Station...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <DashboardHeader title="Waiter Station" userName={user.name} userRole="Waiter" />
      <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div>
          <h2 className="text-2xl font-bold font-headline tracking-tight">Tables</h2>
          <p className="text-muted-foreground">Select a table to view details or create a new order.</p>
        </div>
        
        <Dialog onOpenChange={(open) => {
          if (!open) {
            setSelectedTable(null);
            setCart([]); // Clear cart when dialog closes
          }
        }}>
          <div className="grid flex-1 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {tables.map((table) => (
              <DialogTrigger asChild key={table.id} onClick={() => setSelectedTable(table.id)}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                    table.status === 'occupied' ? 'border-primary border-2 bg-primary/5' : 'border-dashed'
                  }`}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4 gap-2 aspect-square">
                    <Utensils className="h-8 w-8 text-muted-foreground" />
                    <span className="text-2xl font-bold">{table.id}</span>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        table.status === 'occupied' ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {table.status}
                    </span>
                  </CardContent>
                </Card>
              </DialogTrigger>
            ))}
          </div>

          <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-3xl font-headline">Table {selectedTable}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0 flex-1 overflow-hidden">
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
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
