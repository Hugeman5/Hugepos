
'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type Station } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const { toast } = useToast();

  const fetchStations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stations');
      if (!res.ok) throw new Error('Failed to fetch stations.');
      const data = await res.json();
      setStations(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleAddStation = () => {
    if (!newStationName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Station name cannot be empty.' });
      return;
    }
    const newId = newStationName.trim().toLowerCase().replace(/\s+/g, '_');
    if (stations.some(s => s.id === newId)) {
        toast({ variant: 'destructive', title: 'Error', description: `Station with ID "${newId}" already exists.` });
        return;
    }
    const newStation: Station = { id: newId, name: newStationName.trim() };
    setStations(prev => [...prev, newStation]);
    setNewStationName('');
  };

  const handleRemoveStation = (id: string) => {
    setStations(prev => prev.filter(s => s.id !== id));
  };
  
  const handleSaveChanges = async () => {
      setIsSaving(true);
      try {
          const res = await fetch('/api/admin/stations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(stations)
          });
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || 'Failed to save stations.');
          }
          toast({ title: 'Success', description: 'KDS stations saved successfully.' });
          fetchStations(); // re-fetch to be sure
      } catch(error) {
           toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
          setIsSaving(false);
      }
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader title="KDS Station Management" userName="Admin User" userRole="Admin" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Stations</CardTitle>
            <CardDescription>Add, edit, or remove Kitchen Display System stations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station Name</TableHead>
                  <TableHead>Station ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{station.id}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveStation(station.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             <div className="mt-4 flex items-center gap-2">
                 <Input 
                    placeholder="New Station Name"
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStation()}
                 />
                 <Button onClick={handleAddStation}><PlusCircle className="mr-2"/> Add Station</Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={fetchStations}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </main>
    </div>
  );
}
