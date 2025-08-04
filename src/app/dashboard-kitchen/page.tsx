import DashboardHeader from '@/components/dashboard-header';
import { orders } from '@/lib/data';
import KitchenOrderCard from '@/components/kitchen-order-card';

export default function KitchenDashboardPage() {
    const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="flex h-screen w-full flex-col">
      <DashboardHeader title="Kitchen Display System" userName="Chef Mike" userRole="Kitchen" />
      <main className="flex-1 p-4 md:p-6 bg-muted/20 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {pendingOrders.length > 0 ? (
            pendingOrders
                .sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime())
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
