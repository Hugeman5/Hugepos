
'use client';
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { type FloorPlan, type Table, type Area, type Decor } from '@/lib/data';
import { PlusCircle, Trash2, Edit, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FloorPlanObject } from '@/components/waiter/FloorPlanObject';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';

type EditingObject = (Partial<Table> & { objectType: 'table' }) | (Partial<Decor> & { objectType: 'decor' });
type FloorObject = (Table & { type: 'table' }) | (Decor & { type: 'decor' });

const ItemTypes = {
  FLOOR_OBJECT: 'floor_object',
};

interface DraggableObjectProps {
  item: FloorObject;
  onMove: (id: string, type: 'table' | 'decor', x: number, y: number) => void;
  children: React.ReactNode;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ item, onMove, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FLOOR_OBJECT,
    item: { id: item.id, type: item.type, x: item.x, y: item.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn('absolute cursor-move', isDragging ? 'opacity-50 z-20' : 'z-10')}
      style={{ left: item.x, top: item.y }}
    >
      {children}
    </div>
  );
};


export default function FloorPlanAdminPage() {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  
  const handleMove = useCallback(async (id: string, type: 'table' | 'decor', x: number, y: number) => {
    setIsSaving(true);
    setFloorPlan((prev) => {
        if (!prev) return null;
        if (type === 'table') {
            return { ...prev, tables: prev.tables.map(t => t.id === id ? {...t, x, y} : t)};
        } else {
            return { ...prev, decor: prev.decor?.map(d => d.id === id ? {...d, x, y} : d)};
        }
    });

    try {
      const url = type === 'table' ? `/api/floor/tables/${id}` : `/api/floor/decor/${id}`;
      const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x, y }),
      });
      if (!res.ok) throw new Error(`Failed to move ${type}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error moving item', description: (e as Error).message });
      fetchData(); // revert on error
    } finally {
      setIsSaving(false);
    }
  }, [toast, fetchData]);

  const handleOpenObjectDialog = (item?: FloorObject) => {
    if (!item) {
        // Default for new table
        setEditingObject({ objectType: 'table', name: '', areaId: floorPlan?.areas[0]?.id || '', seats: 2, shape: 'square', x: 50, y: 50 });
    } else if (item.type === 'table') {
        setEditingObject({ objectType: 'table', ...item });
    } else {
        setEditingObject({ objectType: 'decor', ...item });
    }
    setIsObjectDialogOpen(true);
  };
  
  const handleSaveObject = async () => {
    if (!editingObject) return;
    setIsSaving(true);

    const isNew = !(editingObject as any).id;
    const url = isNew
        ? (editingObject.objectType === 'table' ? '/api/floor/tables' : '/api/floor/decor')
        : (editingObject.objectType === 'table' ? `/api/floor/tables/${(editingObject as Table).id}` : `/api/floor/decor/${(editingObject as Decor).id}`);
    
    const method = isNew ? 'POST' : 'PATCH';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingObject),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to save object");
        }
        toast({ title: 'Success', description: `Object saved.`});
        setIsObjectDialogOpen(false);
        setEditingObject(null);
        fetchData(); // Refresh data
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDeleteObject = async (item: FloorObject) => {
      if (!window.confirm("Are you sure you want to delete this item?")) return;
      try {
          const url = item.type === 'table' ? `/api/floor/tables/${item.id}` : `/api/floor/decor/${item.id}`;
          const res = await fetch(url, { method: 'DELETE' });
          if (!res.ok) throw new Error("Failed to delete item");
          toast({ title: 'Success', description: 'Item deleted.'});
          fetchData();
      } catch (e) {
          toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
      }
  }


  if (isLoading) return <AdminLayout title="Floor Plan Editor"><div>Loading...</div></AdminLayout>;
  if (!floorPlan) return <AdminLayout title="Floor Plan Editor"><div>Could not load floor plan.</div></AdminLayout>;
  
  const combinedObjects: FloorObject[] = [
    ...(floorPlan.tables || []).map(t => ({...t, type: 'table' as const })),
    ...(floorPlan.decor || []).map(d => ({...d, type: 'decor' as const }))
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <AdminLayout title="Floor Plan Editor">
        <div className="p-4 border-b border-brand-line flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage Floor Plan</h2>
            <p className="text-brand-mute">Drag items to move them. Click to edit.</p>
          </div>
           <div className="flex items-center gap-4">
              {isSaving && <div className="text-sm text-brand-mute flex items-center gap-2"><Save className="h-4 w-4 animate-spin"/> Saving...</div>}
              <Button onClick={() => handleOpenObjectDialog()}><PlusCircle className="mr-2"/> Add Table</Button>
           </div>
        </div>
        <div className="p-4">
            <div className="relative border rounded-lg bg-background h-[70vh] w-full p-4 overflow-auto">
              <DropTarget onDrop={handleMove} />
              {combinedObjects.map(item => (
                  <DraggableObject key={item.id} item={item} onMove={handleMove}>
                    <div className="group cursor-pointer">
                        <FloorPlanObject type={item.type === 'table' ? item.type : item.asset} shape={item.type === 'table' ? item.shape : undefined} seats={item.type === 'table' ? item.seats : undefined} name={item.type === 'table' ? item.name : undefined} />
                        <div className="absolute -top-2 -right-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => handleOpenObjectDialog(item)}><Edit className="h-3 w-3"/></Button>
                            <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => handleDeleteObject(item)}><Trash2 className="h-3 w-3"/></Button>
                        </div>
                    </div>
                  </DraggableObject>
              ))}
            </div>
        </div>
        
        <Dialog open={isObjectDialogOpen} onOpenChange={setIsObjectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                  <DialogTitle>{(editingObject as any)?.id ? `Edit Object` : 'Add New Object'}</DialogTitle>
              </DialogHeader>
              {editingObject?.objectType === 'table' ? (
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
              ) : (
                <div className="text-brand-mute p-4">Editing decor items is not yet implemented.</div>
              )}
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsObjectDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveObject} disabled={isSaving}>Save</Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>
      </AdminLayout>
    </DndProvider>
  );
}

const DropTarget: React.FC<{ onDrop: (id: string, type: 'table' | 'decor', x: number, y: number) => void }> = ({ onDrop }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.FLOOR_OBJECT,
    drop: (item: { id: string, type: 'table' | 'decor' }, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round(item.x + delta.x);
      const top = Math.round(item.y + delta.y);
      onDrop(item.id, item.type, left, top);
    },
  }), [onDrop]);

  return <div ref={drop} className="absolute inset-0 z-0" />;
};
