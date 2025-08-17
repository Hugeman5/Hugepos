
'use client';
import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { type FloorPlan, type ServiceCheck } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import TableGrid from '@/components/waiter/TableGrid';

export default function WaiterDashboardPage() {
  const { toast } = useToast();
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [openChecks, setOpenChecks] = useState<ServiceCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = { uid: 'jwaiter', name: 'Jane Waiter', role: 'Waiter' };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [floorRes, checksRes] = await Promise.all([
          fetch('/api/floor'),
          fetch('/api/service/open'),
        ]);
        if (!floorRes.ok || !checksRes.ok) throw new Error('Failed to fetch floor data');
        const floorData = await floorRes.json();
        const checksData = await checksRes.json();
        setFloorPlan(floorData);
        setOpenChecks(checksData);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  if (isLoading || !floorPlan) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading Waiter Station...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[--bg]">
      <DashboardHeader title="Waiter Station" userName={user.name} userRole={user.role} />
      <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Floor Plan</h2>
          <p className="text-[--text-dim]">Select a table to view details or create a new order.</p>
        </div>
        <TableGrid floorPlan={floorPlan} openChecks={openChecks} user={user} />
      </main>
    </div>
  );
}
