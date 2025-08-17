
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { type KdsTicket, type Station } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Zap, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getTicketAgeColor = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds > 600) return 'bg-destructive text-destructive-foreground'; // > 10 mins
    if (seconds > 300) return 'bg-yellow-500/80 text-black'; // > 5 mins
    return 'bg-primary/20 text-primary-foreground';
}


export default function KdsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecent, setShowRecent] = useState(false);
  const { toast } = useToast();
  
  // Use a state for time to force re-renders
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, ticketsRes] = await Promise.all([
        fetch('/api/admin/stations'),
        fetch(`/api/kds?status=${showRecent ? 'done' : 'active'}`),
      ]);
      if (!stationsRes.ok) throw new Error('Failed to load stations');
      if (!ticketsRes.ok) throw new Error('Failed to load KDS tickets');
      
      const stationsData = await stationsRes.json();
      const ticketsData = await ticketsRes.json();

      setStations(stationsData);
      setTickets(ticketsData);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast, showRecent]);

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 5000); // Poll for data changes
    const timerInterval = setInterval(() => setCurrentTime(new Date()), 1000); // Update timer every second
    
    return () => {
        clearInterval(dataInterval);
        clearInterval(timerInterval);
    };
  }, [fetchData]);

  const handleApiAction = async (endpoint: string, ticketId: string, body: object, successMsg: string) => {
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

  const bumpTicket = (ticketId: string) => handleApiAction('/api/kds/bump', ticketId, { ticketId }, `Ticket ${ticketId.slice(-4)} bumped.`);
  const undoTicket = (ticketId: string) => handleApiAction('/api/kds/undo', ticketId, { ticketId }, `Ticket ${ticketId.slice(-4)} restored.`);
  const toggleExpedite = (ticket: KdsTicket) => handleApiAction('/api/kds/expedite', ticket.id, { ticketId: ticket.id, expedite: !ticket.expedite }, `Ticket ${ticket.id.slice(-4)} expedited status changed.`);

  const ticketsByStation = useMemo(() => {
      const grouped: Record<string, KdsTicket[]> = {};
      for(const station of stations) {
          grouped[station.id] = [];
      }
      for(const ticket of tickets) {
          if (grouped[ticket.station]) {
              grouped[ticket.station].push(ticket);
          }
      }
      // Sort tickets within each station: expedite first, then oldest
      for (const stationId in grouped) {
          grouped[stationId].sort((a,b) => {
              if (a.expedite !== b.expedite) return a.expedite ? -1 : 1;
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
      }
      return grouped;
  }, [tickets, stations]);


  return (
    <div className="flex h-screen w-full flex-col bg-brand-bg">
       <DashboardHeader title="Kitchen Display System" userName="KDS User" userRole="Kitchen" />
       <div className="p-4 border-b border-brand-line">
           <Button onClick={() => setShowRecent(s => !s)}>
               {showRecent ? "Show Active Tickets" : "Show Recent / Undo"}
            </Button>
       </div>
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
                        <Card key={ticket.id} className={cn('flex flex-col', ticket.expedite && 'border-destructive ring-2 ring-destructive')}>
                             <div className="p-3">
                                <div className="flex justify-between items-center">
                                    <span className='text-lg font-bold'>{ticket.table}</span>
                                     <Badge className={cn('font-mono', getTicketAgeColor(new Date(ticket.createdAt)))}>
                                        <Clock className="h-3 w-3 mr-1" />
                                        {timeSince(new Date(ticket.createdAt))}
                                     </Badge>
                                </div>
                             </div>
                             <div className="flex-1 px-3 pb-3 space-y-2">
                                {ticket.lines.map((line, idx) => (
                                    <div key={idx} className="p-2 rounded-lg bg-brand-muted/50">
                                        <p className="font-semibold">{line.qty}x {line.name}</p>
                                        {line.mods && (
                                            <p className="text-xs text-brand-mute pl-2">{line.mods}</p>
                                        )}
                                    </div>
                                ))}
                             </div>
                             <div className="mt-auto p-2 grid grid-cols-2 gap-2">
                                {showRecent ? (
                                    <Button variant="secondary" onClick={() => undoTicket(ticket.id)} className="col-span-2">
                                        <RotateCcw className="mr-2 h-4 w-4" /> Undo Bump
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="secondary" onClick={() => toggleExpedite(ticket)}>
                                            <Zap className="mr-2 h-4 w-4" /> Expedite
                                        </Button>
                                        <Button onClick={() => bumpTicket(ticket.id)}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Bump
                                        </Button>
                                    </>
                                )}
                             </div>
                        </Card>
                    ))}
                    {(ticketsByStation[station.id] || []).length === 0 && (
                        <div className="h-full flex items-center justify-center text-brand-mute">
                            <p>No {showRecent ? 'recent' : 'active'} tickets.</p>
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
