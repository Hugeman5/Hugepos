'use client';
import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { type FloorPlan, type ServiceCheck, type Table } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Utensils, Users, Dot } from 'lucide-react';
import { cn } from '@/lib/utils';

const TableStatusColors: Record<string, string> = {
  free: 'border-dashed',
  seated: 'border-green-400 bg-green-400/10',
  ordering: 'border-blue-400 bg-blue-400/10',
  fired: 'border-yellow-400 bg-yellow-400/10',
  served: 'border-indigo-400 bg-indigo-400/10',
  bill: 'border-purple-400 bg-purple-400/10',
  dirty: 'border-gray-500 bg-gray-500/10',
};

const TableStatusDotColors: Record<string, string> = {
  seated: 'bg-green-400',
  ordering: 'bg-blue-400',
  fired: 'bg-yellow-400',
  served: 'bg-indigo-400',
  bill: 'bg-purple-400',
  dirty: 'bg-gray-500',
}

export default function WaiterDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [openChecks, setOpenChecks] = useState<ServiceCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState('1');

  // Mocked user for now
  const user = { uid: 'jwaiter', name: 'Jane Waiter' };

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
  
  const handleTableClick = (table: Table) => {
    const check = openChecks.find(c => c.tableId === table.id);
    if (check) {
      router.push(`/table/${table.id}`);
    } else {
      setSelectedTable(table);
      setGuestCount('1');
      setIsSeatDialogOpen(true);
    }
  };
  
  const handleSeatGuests = async () => {
      if (!selectedTable || !guestCount) return;
      
      try {
        const res = await fetch('/api/service/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableId: selectedTable.id,
                server: user,
                guests: parseInt(guestCount, 10),
            })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to open table");
        }
        const newCheck = await res.json();
        setIsSeatDialogOpen(false);
        router.push(`/table/${newCheck.tableId}`);

      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
  }
  
  if (isLoading) {
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
          <h2 className="text-2xl font-bold font-headline tracking-tight">Floor Plan</h2>
          <p className="text-muted-foreground">Select a table to view details or create a new order.</p>
        </div>
        
        <div className="relative flex-1 border rounded-lg bg-card p-4">
            {floorPlan?.tables.map((table) => {
                const check = openChecks.find(c => c.tableId === table.id);
                const status = check?.state || 'free';
                return (
                    <Card
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={cn(
                            'absolute cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 w-24 h-24 border-2',
                             TableStatusColors[status] || 'border-dashed'
                        )}
                        style={{ left: `${table.x}px`, top: `${table.y}px` }}
                    >
                         <CardContent className="flex flex-col items-center justify-center p-2 gap-1 h-full">
                            {status !== 'free' && <Dot className={cn("absolute -top-3 -right-3 h-6 w-6", TableStatusDotColors[status])} />}
                            <Utensils className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xl font-bold">{table.name}</span>
                            {check && (
                                <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {check.guests}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>

        <Dialog open={isSeatDialogOpen} onOpenChange={setIsSeatDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Seat Guests at {selectedTable?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="guest-count">Number of Guests</Label>
                <Input 
                    id="guest-count" 
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    min="1"
                    max={selectedTable?.seats}
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSeatDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSeatGuests}>Seat Guests</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
