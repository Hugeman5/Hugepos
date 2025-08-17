
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
          fetchStations();
      } catch(error) {
           toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
          setIsSaving(false);
      }
  }

  return (
    <AdminLayout title="KDS Station Management">
        <Card className="bg-brand-card border-brand-line">
          <div className="p-4 border-b border-brand-line">
            <h2 className="text-xl font-semibold">Manage Stations</h2>
            <p className="text-brand-mute">Add, edit, or remove Kitchen Display System stations.</p>
          </div>
          <div className="p-4">
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
                      <Button variant="secondary" size="icon" onClick={() => handleRemoveStation(station.id)}>
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
                 <Button onClick={handleAddStation} className="bg-brand-accent"><PlusCircle className="mr-2"/> Add Station</Button>
            </div>
          </div>
        </Card>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={fetchStations}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-brand-accent">
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    </AdminLayout>
  );
}
