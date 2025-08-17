
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type ModifierSet, type ModifierOption } from '@/lib/menuRepo';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type EditingSet = Partial<Omit<ModifierSet, 'options'>> & { options?: Partial<ModifierOption>[] };

export default function ModifiersPage() {
  const [sets, setSets] = useState<ModifierSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSet, setEditingSet] = useState<EditingSet | null>(null);
  const [isSetDialogOpen, setIsSetDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<Partial<ModifierOption> | null>(null);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/menu/modifiers');
      if (!res.ok) throw new Error('Failed to load modifiers');
      const data = await res.json();
      setSets(data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSet = async () => {
    if (!editingSet) return;
    const url = editingSet.id ? `/api/admin/menu/modifiers/${editingSet.id}` : '/api/admin/menu/modifiers';
    const method = editingSet.id ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSet),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Success', description: 'Modifier set saved.' });
      setIsSetDialogOpen(false);
      setEditingSet(null);
      fetchData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!window.confirm("Are you sure? This will remove the set from all items.")) return;
    try {
      await fetch(`/api/admin/menu/modifiers/${setId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Modifier set deleted.' });
      setEditingSet(null);
      fetchData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  const handleSaveOption = async () => {
    if (!editingOption || !editingSet?.id) return;
    const { id: setId } = editingSet;
    const url = editingOption.id ? `/api/admin/menu/modifiers/${setId}/options/${editingOption.id}` : `/api/admin/menu/modifiers/${setId}/options`;
    const method = editingOption.id ? 'PATCH' : 'POST';
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingOption)
        });
        if (!res.ok) throw new Error(await res.text());
        toast({ title: 'Success', description: 'Option saved.' });
        setIsOptionDialogOpen(false);
        setEditingOption(null);
        fetchData();
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  const handleDeleteOption = async (optionId: string) => {
      if (!editingSet?.id) return;
      if (!window.confirm("Are you sure?")) return;
      try {
        await fetch(`/api/admin/menu/modifiers/${editingSet.id}/options/${optionId}`, { method: 'DELETE' });
        toast({ title: 'Success', description: 'Option deleted.'});
        fetchData(); // Refresh list
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  }
  
  if (isLoading) return <AdminLayout title="Modifiers">Loading...</AdminLayout>

  return (
    <AdminLayout title="Modifiers">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Modifier Sets</h1>
        <Button onClick={() => { setEditingSet({ name: '', type: 'single', required: true, min: 1, max: 1 }); setIsSetDialogOpen(true); }}>
          <PlusCircle className="mr-2" /> Add Set
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold">Sets</h2>
            </div>
            <div className="p-2 space-y-1">
              {sets.map(set => (
                <div key={set.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-brand-muted cursor-pointer" onClick={() => setEditingSet(sets.find(s => s.id === set.id)!)}>
                  <span className="flex-1 font-medium">{set.name}</span>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingSet(set); setIsSetDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
            {editingSet && editingSet.id && (
              <Card>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-xl">{editingSet.name}</h2>
                    <Button onClick={() => { setEditingOption({ name: '', priceDeltaCents: 0}); setIsOptionDialogOpen(true); }}>
                        <PlusCircle className="mr-2"/> Add Option
                    </Button>
                </div>
                <div className="p-4">
                    <ul>
                    {(sets.find(s => s.id === editingSet.id)?.options || []).map(opt => (
                        <li key={opt.id} className="flex items-center p-2 hover:bg-brand-muted rounded-lg">
                            <span className="flex-1">{opt.name} (+{opt.priceDeltaCents / 100})</span>
                             <Button size="icon" variant="ghost" onClick={() => { setEditingOption(opt); setIsOptionDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                             <Button size="icon" variant="ghost" onClick={() => handleDeleteOption(opt.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </li>
                    ))}
                    </ul>
                </div>
              </Card>
            )}
        </div>
      </div>

      <Dialog open={isSetDialogOpen} onOpenChange={setIsSetDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSet?.id ? 'Edit Set' : 'Add Set'}</DialogTitle></DialogHeader>
          {editingSet && (
            <div className="space-y-4 py-4">
              <Input placeholder="Set Name" value={editingSet.name} onChange={e => setEditingSet(s => s ? { ...s, name: e.target.value } : null)} />
              <Select value={editingSet.type} onValueChange={(v) => setEditingSet(s => s ? { ...s, type: v as any } : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Choice</SelectItem>
                  <SelectItem value="multi">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2"><Switch id="required" checked={editingSet.required} onCheckedChange={c => setEditingSet(s => s ? {...s, required: c} : null)} /><Label htmlFor="required">Required</Label></div>
              <Input type="number" placeholder="Min" value={editingSet.min} onChange={e => setEditingSet(s => s ? { ...s, min: parseInt(e.target.value) } : null)} />
              <Input type="number" placeholder="Max" value={editingSet.max} onChange={e => setEditingSet(s => s ? { ...s, max: parseInt(e.target.value) } : null)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsSetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSet}>Save Set</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingOption?.id ? 'Edit Option' : 'Add Option'}</DialogTitle></DialogHeader>
            {editingOption && (
                <div className="space-y-4 py-4">
                    <Input placeholder="Option Name" value={editingOption.name} onChange={e => setEditingOption(o => o ? {...o, name: e.target.value} : null)} />
                    <Input type="number" placeholder="Price Delta (cents)" value={editingOption.priceDeltaCents} onChange={e => setEditingOption(o => o ? {...o, priceDeltaCents: parseInt(e.target.value)} : null)} />
                </div>
            )}
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsOptionDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveOption}>Save Option</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
