'use client';
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type FloorPlan, type Table, type Area } from '@/lib/data';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function FloorPlanAdminPage() {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Partial<Table> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/floor');
      if (!res.ok) throw new Error('Failed to fetch floor plan');
      const data = await res.json();
      setFloorPlan(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenTableDialog = (table?: Table) => {
    setEditingTable(table || { name: '', areaId: floorPlan?.areas[0]?.id || '', seats: 2, shape: 'square', x: 50, y: 50 });
    setIsTableDialogOpen(true);
  };
  
  const handleSaveTable = async () => {
    if (!editingTable) return;
    
    const url = editingTable.id ? `/api/floor/tables/${editingTable.id}` : '/api/floor/tables';
    const method = editingTable.id ? 'PATCH' : 'POST';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingTable),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to save table");
        }
        toast({ title: 'Success', description: `Table ${editingTable.name} saved.`});
        setIsTableDialogOpen(false);
        setEditingTable(null);
        fetchData(); // Refresh data
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }
  
  const handleDeleteTable = async (tableId: string) => {
      if (!window.confirm("Are you sure you want to delete this table?")) return;
      try {
          const res = await fetch(`/api/floor/tables/${tableId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Failed to delete table");
          toast({ title: 'Success', description: 'Table deleted.'});
          fetchData();
      } catch (e) {
          toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
  }


  if (isLoading) return <AdminLayout title="Floor Plan Editor"><div>Loading...</div></AdminLayout>;
  if (!floorPlan) return <AdminLayout title="Floor Plan Editor"><div>Could not load floor plan.</div></AdminLayout>;

  return (
    <AdminLayout title="Floor Plan Editor">
      <Card>
        <CardHeader>
          <CardTitle>Manage Floor Plan</CardTitle>
          <CardDescription>Visually arrange your restaurant's tables and service areas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-end mb-4">
                 <Button onClick={() => handleOpenTableDialog()}><PlusCircle className="mr-2"/> Add Table</Button>
            </div>
            <div className="relative border rounded-lg bg-background h-[600px] w-full p-4 overflow-auto">
              {floorPlan.areas.map(area => (
                <div key={area.id} className="mb-8">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: area.color }}>{area.name}</h3>
                    <div className="relative border-2 border-dashed h-full rounded-md" style={{ borderColor: area.color }}>
                        {floorPlan.tables.filter(t => t.areaId === area.id).map(table => (
                            <div
                                key={table.id}
                                className={cn('absolute group w-24 h-24 border-2 flex flex-col items-center justify-center cursor-pointer', table.shape === 'round' && 'rounded-full')}
                                style={{ left: `${table.x}px`, top: `${table.y}px`, borderColor: area.color }}
                            >
                               <div className="z-10">
                                   <p className="font-bold text-lg">{table.name}</p>
                                   <p className="text-xs text-muted-foreground">{table.seats} seats</p>
                               </div>
                               <div className="absolute inset-0 bg-card opacity-80 group-hover:opacity-100 transition-opacity"></div>
                               <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleOpenTableDialog(table)}><Edit className="h-3 w-3"/></Button>
                                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteTable(table.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                               </div>
                            </div>
                        ))}
                    </div>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingTable?.id ? `Edit ${editingTable.name}` : 'Add New Table'}</DialogTitle>
            </DialogHeader>
            {editingTable && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={editingTable.name} onChange={(e) => setEditingTable(t => t ? {...t, name: e.target.value} : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="area" className="text-right">Area</Label>
                        <Select value={editingTable.areaId} onValueChange={(val) => setEditingTable(t => t ? {...t, areaId: val} : null)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>{floorPlan.areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="seats" className="text-right">Seats</Label>
                        <Input id="seats" type="number" value={editingTable.seats} onChange={(e) => setEditingTable(t => t ? {...t, seats: parseInt(e.target.value, 10)} : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="x" className="text-right">X Pos</Label>
                        <Input id="x" type="number" value={editingTable.x} onChange={(e) => setEditingTable(t => t ? {...t, x: parseInt(e.target.value, 10)} : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="y" className="text-right">Y Pos</Label>
                        <Input id="y" type="number" value={editingTable.y} onChange={(e) => setEditingTable(t => t ? {...t, y: parseInt(e.target.value, 10)} : null)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shape" className="text-right">Shape</Label>
                        <Select value={editingTable.shape} onValueChange={(val) => setEditingTable(t => t ? {...t, shape: val as any} : null)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="square">Square</SelectItem>
                                <SelectItem value="round">Round</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsTableDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTable}>Save Table</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
