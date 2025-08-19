
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { type KdsTicket, type Station, type Order, type User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Zap, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShiftControls from '@/components/staff/ShiftControls';
import { getSession } from '@/lib/session';

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getTicketAgeColor = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds > 600) return 'bg-destructive text-destructive-foreground'; // > 10 mins
    if (seconds > 300) return 'bg-yellow-500/80 text-black'; // > 5 mins
    return 'bg-primary/20 text-primary-foreground';
}

export default function KdsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [tickets, setTickets] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecent, setShowRecent] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const u = getSession();
    setUser(u);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, ticketsRes] = await Promise.all([
        fetch('/api/admin/stations'),
        fetch(`/api/kds`),
      ]);
      if (!stationsRes.ok) throw new Error('Failed to load stations');
      if (!ticketsRes.ok) throw new Error('Failed to load KDS tickets');
      
      const stationsData = await stationsRes.json();
      const ticketsData = await ticketsRes.json();

      setStations(stationsData);
      setTickets(ticketsData.tickets);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 5000); // Poll for data changes
    const timerInterval = setInterval(() => setCurrentTime(new Date()), 1000); // Update timer every second
    
    return () => {
        clearInterval(dataInterval);
        clearInterval(timerInterval);
    };
  }, [fetchData]);

  const handleApiAction = async (endpoint: string, ticketId: string, lineId: string, body: object, successMsg: string) => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Action failed for ticket ${ticketId}`);
      }
      toast({ title: 'Success', description: successMsg });
      fetchData(); // Re-fetch immediately
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };

  const bumpTicket = (ticketId: string, lineId: string) => handleApiAction('/api/kds/bump', ticketId, lineId, { orderId: ticketId, lineId }, `Item bumped.`);

  const ticketsByStation = useMemo(() => {
      const grouped: Record<string, Order[]> = {};
      for(const station of stations) {
          grouped[station.id] = [];
      }
      for(const ticket of tickets) {
        for (const line of ticket.lines) {
          if (line.station) {
            if (!grouped[line.station]) grouped[line.station] = [];
            
            // Add ticket only once per station
            if (!grouped[line.station].find(t => t.id === ticket.id)) {
                grouped[line.station].push(ticket);
            }
          }
        }
      }
      // Sort tickets within each station: oldest first
      for (const stationId in grouped) {
          grouped[stationId].sort((a,b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
      }
      return grouped;
  }, [tickets, stations]);


  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen w-full flex-col bg-brand-bg">
       <DashboardHeader title="Kitchen Display System" user={user} />
       
      <main className="flex-1 flex overflow-x-auto">
        <div className="flex h-full min-w-full">
        {isLoading ? (
             <div className="w-full h-full flex items-center justify-center">
                <p className="text-brand-mute">Loading KDS...</p>
            </div>
        ) : stations.map(station => (
            <div key={station.id} className="flex flex-col flex-shrink-0 w-80 md:w-96 h-full border-r border-brand-line">
                <div className="p-3 bg-brand-panel sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-center">{station.name}</h2>
                </div>
                <div className="p-2 flex-1 overflow-y-auto bg-brand-bg space-y-3">
                    {(ticketsByStation[station.id] || []).map(ticket => (
                        <Card key={ticket.id} className={cn('flex flex-col')}>
                             <div className="p-3">
                                <div className="flex justify-between items-center">
                                    <span className='text-lg font-bold'>Order #{ticket.ticketNo}</span>
                                     <Badge className={cn('font-mono', getTicketAgeColor(new Date(ticket.createdAt).toISOString()))}>
                                        <Clock className="h-3 w-3 mr-1" />
                                        {timeSince(new Date(ticket.createdAt).toISOString())}
                                     </Badge>
                                </div>
                             </div>
                             <div className="flex-1 px-3 pb-3 space-y-2">
                                {ticket.lines.filter(l => l.station === station.id && l.state !== 'bumped').map((line, idx) => (
                                    <div key={idx} className="p-2 rounded-lg bg-brand-muted/50 cursor-pointer" onClick={() => bumpTicket(ticket.id, line.id)}>
                                        <p className="font-semibold">{line.qty}x {line.name}</p>
                                    </div>
                                ))}
                             </div>
                        </Card>
                    ))}
                    {(ticketsByStation[station.id] || []).length === 0 && (
                        <div className="h-full flex items-center justify-center text-brand-mute">
                            <p>No active tickets.</p>
                        </div>
                    )}
                </div>
            </div>
        ))}
        </div>
      </main>
    </div>
  );
}
