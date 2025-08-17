
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { type Ingredient } from '@/lib/data';
import Link from 'next/link';

type SummaryItem = Ingredient & {
  onHand: number;
  reorderPoint: number;
  status: 'ok' | 'low' | 'out';
};

export default function InventoryPage() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<'receive' | 'adjust'>('receive');
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/inventory/summary');
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch inventory summary.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = dialogMode === 'receive' ? '/api/inventory/receive' : '/api/inventory/adjust';
    const body =
      dialogMode === 'receive'
        ? { ingredientId: selectedIngredient, quantity: Number(quantity), note }
        : { ingredientId: selectedIngredient, delta: Number(quantity), note };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Success', description: `Stock ${dialogMode === 'receive' ? 'received' : 'adjusted'} successfully.` });
        fetchSummary(); // Refresh data
        setIsDialogOpen(false); // Close dialog
      } else {
        throw new Error(result.message || 'An error occurred.');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if (!isDialogOpen) {
        setSelectedIngredient('');
        setQuantity('');
        setNote('');
    }
  }, [isDialogOpen]);

  const getStatusBadge = (status: 'ok' | 'low' | 'out') => {
    switch (status) {
      case 'ok':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">In Stock</Badge>;
      case 'low':
        return <Badge variant="destructive" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Low Stock</Badge>;
      case 'out':
        return <Badge variant="destructive">Out of Stock</Badge>;
    }
  };

  return (
    <AdminLayout title="Inventory Management">
        <Card className="bg-brand-card border-brand-line">
          <div className="flex flex-row items-center justify-between p-4 border-b border-brand-line">
            <div>
              <h2 className="text-xl font-semibold">Inventory Summary</h2>
              <p className="text-brand-mute">Current stock levels for all ingredients.</p>
            </div>
            <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setDialogMode('receive')}>Receive Stock</Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button variant="secondary" onClick={() => setDialogMode('adjust')}>Adjust Stock</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                        <DialogTitle>{dialogMode === 'receive' ? 'Receive Stock' : 'Adjust Stock'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ingredient" className="text-right">Ingredient</Label>
                            <Select onValueChange={setSelectedIngredient} value={selectedIngredient}>
                                <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select an ingredient" />
                                </SelectTrigger>
                                <SelectContent>
                                {summary.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">
                                {dialogMode === 'receive' ? 'Quantity' : 'Adjustment'}
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="col-span-3"
                                placeholder={dialogMode === 'receive' ? 'e.g., 1000' : 'e.g., -50 or 50'}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="note" className="text-right">Note</Label>
                            <Input
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="col-span-3"
                                placeholder="Optional note (e.g., invoice #, reason)"
                            />
                        </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting || !selectedIngredient || !quantity}>
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              <Button variant="secondary" asChild>
                  <Link href="/admin/inventory/moves">View History</Link>
              </Button>
            </div>
          </div>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                ) : summary.length > 0 ? (
                  summary.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.onHand}</TableCell>
                      <TableCell className="text-right">{item.reorderPoint}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center">No inventory data found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
    </AdminLayout>
  );
}
