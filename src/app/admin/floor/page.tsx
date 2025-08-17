
'use client';
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { type FloorPlan, type Table, type Area } from '@/lib/data';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FloorPlanObject } from '@/components/waiter/FloorPlanObject';

type EditingObject = (Partial<Table> & { objectType: 'table' }) | (Partial<any> & { objectType: 'decor' });

export default function FloorPlanAdminPage() {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [isObjectDialogOpen, setIsObjectDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<EditingObject | null>(null);

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
    setEditingObject({ objectType: 'table', ...table, name: table?.name || '', areaId: table?.areaId || floorPlan?.areas[0]?.id || '', seats: table?.seats || 2, shape: table?.shape || 'square', x: table?.x || 50, y: table?.y || 50 });
    setIsObjectDialogOpen(true);
  };
  
  const handleSaveObject = async () => {
    if (!editingObject) return;
    
    // This is a simplified example. A real implementation would have separate endpoints for decor.
    // For now, we'll focus on just updating tables as that's what the API supports.
    if (editingObject.objectType !== 'table') {
        toast({ title: 'Info', description: 'Editing decor items is not yet supported.'})
        setIsObjectDialogOpen(false);
        return;
    }

    const tableData = editingObject as Partial<Table>;
    const url = tableData.id ? `/api/floor/tables/${tableData.id}` : '/api/floor/tables';
    const method = tableData.id ? 'PATCH' : 'POST';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tableData),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to save table");
        }
        toast({ title: 'Success', description: `Table ${tableData.name} saved.`});
        setIsObjectDialogOpen(false);
        setEditingObject(null);
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
      <div className="p-4 border-b border-brand-line">
        <h2 className="text-xl font-semibold">Manage Floor Plan</h2>
        <p className="text-brand-mute">Visually arrange your restaurant's tables and service areas.</p>
      </div>
      <div className="p-4">
          <div className="flex justify-end mb-4">
               <Button onClick={() => handleOpenTableDialog()}><PlusCircle className="mr-2"/> Add Table</Button>
          </div>
          <div className="relative border rounded-lg bg-background h-[600px] w-full p-4 overflow-auto">
            {floorPlan.areas.map(area => (
              <div key={area.id} className="mb-8">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: area.color }}>{area.name}</h3>
                  <div className="relative border-2 border-dashed h-full rounded-md p-4" style={{ borderColor: area.color }}>
                      {floorPlan.tables.filter(t => t.areaId === area.id).map(table => (
                          <div
                              key={table.id}
                              className="absolute group cursor-pointer"
                              style={{ left: `${table.x}px`, top: `${table.y}px` }}
                          >
                             <FloorPlanObject type="table" shape={table.shape} seats={table.seats} name={table.name} />
                             <div className="absolute -top-2 -right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => handleOpenTableDialog(table)}><Edit className="h-3 w-3"/></Button>
                                 <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => handleDeleteTable(table.id)}><Trash2 className="h-3 w-3"/></Button>
                             </div>
                          </div>
                      ))}
                       {floorPlan.decor?.map(item => (
                          <div key={item.id} className="absolute group" style={{ left: `${item.x}px`, top: `${item.y}px` }}>
                            <FloorPlanObject type={item.asset} />
                          </div>
                       ))}
                  </div>
              </div>
            ))}
          </div>
      </div>
      
      <Dialog open={isObjectDialogOpen} onOpenChange={setIsObjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingObject?.id ? `Edit Object` : 'Add New Object'}</DialogTitle>
            </DialogHeader>
            {editingObject?.objectType === 'table' && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={(editingObject as Table).name} onChange={(e) => setEditingObject(o => o ? {...o, name: e.target.value} : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="area" className="text-right">Area</Label>
                        <Select value={(editingObject as Table).areaId} onValueChange={(val) => setEditingObject(o => o ? {...o, areaId: val} : null)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>{floorPlan.areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="seats" className="text-right">Seats</Label>
                        <Input id="seats" type="number" value={(editingObject as Table).seats} onChange={(e) => setEditingObject(o => o ? {...o, seats: parseInt(e.target.value, 10)} : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="x" className="text-right">X Pos</Label>
                        <Input id="x" type="number" value={editingObject.x} onChange={(e) => setEditingObject(o => o ? {...o, x: parseInt(e.target.value, 10)} : null)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="y" className="text-right">Y Pos</Label>
                        <Input id="y" type="number" value={editingObject.y} onChange={(e) => setEditingObject(o => o ? {...o, y: parseInt(e.target.value, 10)} : null)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shape" className="text-right">Shape</Label>
                        <Select value={(editingObject as Table).shape} onValueChange={(val) => setEditingObject(o => o ? {...o, shape: val as any} : null)}>
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
                <Button variant="secondary" onClick={() => setIsObjectDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveObject}>Save</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
