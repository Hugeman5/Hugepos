
'use client';
import { type FloorPlan, type ServiceCheck, type Table } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Utensils, Users, Dot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TableStatusColors: Record<string, string> = {
  free: 'border-[var(--line)]',
  seated: 'border-green-400 bg-green-900/40',
  ordering: 'border-blue-400 bg-blue-900/40',
  fired: 'border-yellow-400 bg-yellow-900/40',
  served: 'border-indigo-400 bg-indigo-900/40',
  bill: 'border-purple-400 bg-purple-900/40',
  dirty: 'border-gray-500 bg-gray-800/40',
};

const TableStatusDotColors: Record<string, string> = {
  seated: 'text-green-400',
  ordering: 'text-blue-400',
  fired: 'text-yellow-400',
  served: 'text-indigo-400',
  bill: 'text-purple-400',
  dirty: 'text-gray-500',
};

type TableGridProps = {
    floorPlan: FloorPlan;
    openChecks: ServiceCheck[];
    user: { uid: string; name: string; role: string };
    shiftId?: string;
};

export default function TableGrid({ floorPlan, openChecks, user, shiftId }: TableGridProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [guestCount, setGuestCount] = useState('1');

    const handleTableClick = (table: Table) => {
        const check = openChecks.find(c => c.tableId === table.id);
        if (check) {
          router.push(`/table/${table.id}`);
        } else {
          if (!shiftId) {
            toast({ variant: 'destructive', title: 'Shift Required', description: 'A shift must be open to seat a new table.' });
            return;
          }
          setSelectedTable(table);
          setGuestCount('1');
          setIsSeatDialogOpen(true);
        }
    };

    const handleSeatGuests = async () => {
      if (!selectedTable || !guestCount || !shiftId) return;
      
      try {
        const res = await fetch('/api/service/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableId: selectedTable.id,
                server: user,
                guests: parseInt(guestCount, 10),
                shiftId,
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

  return (
    <>
      <div className="relative flex-1 rounded-2xl bg-[var(--panel)] p-4">
        {floorPlan?.tables.map((table) => {
          const check = openChecks.find(c => c.tableId === table.id);
          const status = check?.state || 'free';
          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={cn(
                'absolute cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 w-28 h-28 border-2 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                TableStatusColors[status] || 'border-dashed'
              )}
              style={{ left: `${table.x}px`, top: `${table.y}px` }}
            >
              <div className="flex flex-col items-center justify-center p-2 gap-1 h-full relative">
                {status !== 'free' && <Dot className={cn("absolute -top-4 -right-4 h-8 w-8", TableStatusDotColors[status])} />}
                <Utensils className="h-6 w-6 text-[--text-dim]" />
                <span className="text-xl font-bold">{table.name}</span>
                {check ? (
                  <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 text-[--text-dim]">
                    <Users className="h-3 w-3" /> {check.guests}
                  </div>
                ) : (
                  <div className="text-xs text-[--text-dim]">Free</div>
                )}
              </div>
            </button>
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
                    className="bg-[--muted] border-[--line] rounded-xl px-3 py-2 mt-2"
                />
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsSeatDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSeatGuests}>Seat Guests</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}
