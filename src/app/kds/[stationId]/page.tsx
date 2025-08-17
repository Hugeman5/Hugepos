
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard-header';
import { type KdsTicket, type Station, type PrepStatus } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, PlayCircle, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 60;
    if (interval > 1) {
      const minutes = Math.floor(interval);
      return `${minutes}m ago`;
    }
    return `${Math.floor(seconds)}s ago`;
};

const getStatusBadgeVariant = (status: PrepStatus) => {
  switch (status) {
    case 'in_progress':
      return 'bg-blue-500/80 text-white';
    case 'queued':
    default:
      return 'bg-gray-500/80 text-white';
  }
};


export default function KdsStationPage() {
  const params = useParams();
  const stationId = params.stationId as string;

  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [station, setStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedTickets, setHighlightedTickets] = useState<Set<string>>(new Set());
  const previousTicketIds = useRef<Set<string>>(new Set());
  
  const { toast } = useToast();

  const fetchStationDetails = useCallback(async () => {
    if (!stationId) return;
    try {
        const res = await fetch('/api/admin/stations');
        if (!res.ok) throw new Error();
        const stations: Station[] = await res.json();
        const currentStation = stations.find(s => s.id === stationId);
        if (currentStation) {
            setStation(currentStation);
        } else {
             toast({ variant: 'destructive', title: 'Error', description: `Station with ID "${stationId}" not found.` });
        }
    } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch station details.' });
    }
  }, [stationId, toast]);


  const fetchTickets = useCallback(async () => {
    if (!stationId) return;
    try {
      const res = await fetch(`/api/kds/tickets?station=${stationId}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data: KdsTicket[] = await res.json();

      const newTicketIds = new Set(data.map(t => t.orderId));
      const newlyAdded = new Set([...newTicketIds].filter(id => !previousTicketIds.current.has(id)));
      
      setTickets(data);
      setHighlightedTickets(newlyAdded);

      previousTicketIds.current = newTicketIds;

      if (newlyAdded.size > 0) {
        setTimeout(() => {
          setHighlightedTickets(current => {
            const next = new Set(current);
            newlyAdded.forEach(id => next.delete(id));
            return next;
          });
        }, 3000);
      }

    } catch (error) {
      console.error(error); // Keep console error for debugging
    } finally {
      setIsLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchStationDetails();
    fetchTickets();
    const interval = setInterval(fetchTickets, 2000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchStationDetails]);

  const updateLineStatus = async (orderId: string, lineId: string, status: PrepStatus) => {
    try {
        const res = await fetch(`/api/kds/lines/${orderId}/${lineId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error(`Failed to update line ${lineId}`);

        setTickets(currentTickets => currentTickets.map(ticket => {
            if (ticket.orderId === orderId) {
                return {
                    ...ticket,
                    items: ticket.items.map(item =>
                        item.lineId === lineId ? { ...item, status } : item
                    ).filter(item => item.status !== 'done')
                }
            }
            return ticket;
        }).filter(ticket => ticket.items.length > 0));

    } catch (error) {
        toast({ variant: 'destructive', title: 'Update Error', description: (error as Error).message });
    }
  };
  
  const toggleLineStatus = (orderId: string, lineId: string, currentStatus: PrepStatus) => {
      const nextStatus: PrepStatus = currentStatus === 'queued' ? 'in_progress' : 'done';
      updateLineStatus(orderId, lineId, nextStatus);
  }
  
  const updateAllLines = (ticket: KdsTicket, status: PrepStatus) => {
      ticket.items.forEach(item => {
          if (item.status !== 'done') {
              updateLineStatus(ticket.orderId, item.lineId, status);
          }
      });
  }

  return (
    <div className="flex h-screen w-full flex-col">
       <DashboardHeader title={station?.name ? `${station.name} KDS` : 'KDS'} userName="KDS User" userRole="Kitchen" />
      <main className="flex-1 p-4 md:p-6 bg-[--muted]/20 overflow-y-auto">
        <div className="mb-4">
             <Link href="/kitchen"><Button variant="secondary">Back to Stations</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading ? (
                <div className="col-span-full h-[60vh] flex items-center justify-center">
                    <p className="text-[--text-dim]">Loading tickets for {station?.name || stationId}...</p>
                </div>
            ) : tickets.length > 0 ? (
                tickets.map((ticket) => (
                    <Card key={ticket.orderId} className={cn(
                        'transition-all duration-500 flex flex-col',
                        highlightedTickets.has(ticket.orderId) ? 'shadow-lg border-[--accent]' : '',
                    )}>
                        <div className="p-4">
                            <div className="flex justify-between items-center">
                                <span className='text-lg font-bold'>Order #{ticket.number}</span>
                                <span className="text-sm font-semibold text-[--accent] flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {timeSince(new Date(ticket.createdAt))}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-4 pt-0 space-y-3">
                            {ticket.items.map(item => (
                                <div key={item.lineId} className="flex flex-col gap-2 p-2 rounded-xl bg-[--bg] cursor-pointer hover:bg-[--muted]" onClick={() => toggleLineStatus(ticket.orderId, item.lineId, item.status)}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{item.qty}x {item.name}</p>
                                        <Badge className={cn('capitalize', getStatusBadgeVariant(item.status))}>{item.status.replace('_', ' ')}</Badge>
                                    </div>
                                    {item.mods && item.mods.length > 0 && (
                                        <p className="text-sm text-[--text-dim] pl-2">{item.mods.map(m => m.name).join(', ')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                         <div className="mt-auto p-4 grid grid-cols-2 gap-2">
                            <Button variant="secondary" onClick={() => updateAllLines(ticket, 'in_progress')}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Start All
                            </Button>
                             <Button onClick={() => updateAllLines(ticket, 'done')}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Done All
                            </Button>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="col-span-full h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                         <Utensils className="h-16 w-16 text-[--text-dim] mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold">All tickets clear!</h2>
                        <p className="text-[--text-dim]">Waiting for new orders at {station?.name}...</p>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
