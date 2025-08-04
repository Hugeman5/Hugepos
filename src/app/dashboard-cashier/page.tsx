import DashboardHeader from '@/components/dashboard-header';
import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import { products, categories } from '@/lib/data';

export default function CashierDashboardPage() {
  return (
    <div className="flex h-screen w-full flex-col bg-muted/40">
      <DashboardHeader title="Cashier POS" userName="John Cashier" userRole="Cashier" />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 lg:gap-8 lg:p-6 overflow-hidden">
        <div className="md:col-span-2 h-full flex flex-col min-h-0">
          <ProductGrid products={products} categories={categories} />
        </div>
        <div className="md:col-span-1 h-full flex flex-col min-h-0">
          <OrderCart />
        </div>
      </main>
    </div>
  );
}
