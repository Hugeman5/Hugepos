import ProductGrid from '@/components/product-grid';
import OrderCart from '@/components/order-cart';
import DashboardHeader from '@/components/dashboard-header';

export default function CashierDashboard() {
  return (
    <div className="grid h-screen grid-cols-12">
      <div className="col-span-8 bg-gray-100 p-8">
        <DashboardHeader title="Point of Sale" />
        <ProductGrid />
      </div>
      <div className="col-span-4 border-l">
        <OrderCart />
      </div>
    </div>
  );
}
