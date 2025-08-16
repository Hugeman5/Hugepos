
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Station } from '@/lib/data';
import { ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KdsHomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch('/api/admin/stations');
        if (!res.ok) {
          throw new Error('Failed to fetch stations');
        }
        const data = await res.json();
        setStations(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load station list.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, [toast]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader title="Kitchen Display System" userName="KDS User" userRole="Kitchen" />
      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-4 md:p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">Select a Station</h1>
          <p className="text-muted-foreground">Choose a kitchen station to view its active tickets.</p>
        </div>
        {isLoading ? (
          <p>Loading stations...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
            {stations.map((station) => (
              <Link href={`/kds/${station.id}`} key={station.id}>
                <Card className="hover:bg-primary/10 hover:shadow-lg transition-all duration-200">
                  <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
                    <ChefHat className="h-12 w-12 text-primary" />
                    <h2 className="text-xl font-semibold">{station.name}</h2>
                    <Button variant="secondary">Go to Station</Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
         { !isLoading && stations.length === 0 && (
             <p className="text-muted-foreground">No stations configured. Please add stations in the admin panel.</p>
         )}
      </main>
    </div>
  );
}
