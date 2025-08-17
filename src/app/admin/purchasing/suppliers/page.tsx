
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Supplier } from '@/lib/repos/suppliersRepo';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  async function fetchData() {
    setIsLoading(true);
    try {
        const res = await fetch('/api/suppliers', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch suppliers');
        setSuppliers(await res.json());
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editingSupplier) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSupplier),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Success', description: 'Supplier saved.' });
      setIsDialogOpen(false);
      fetchData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete the supplier but not their items.')) return;
    try {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Supplier deleted.' });
      fetchData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    }
  };
  
  const handleImportCsv = async () => {
    if (!editingSupplier || !csvData) return;
    setIsUploading(true);
    try {
        const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        const itemsToUpsert = parsed.data.map((row: any, i: number) => {
            if (!row.sku && !row.name) {
                throw new Error(`Row ${i+2}: SKU or Name is required.`);
            }
            return {
                id: `${editingSupplier.id}_${row.sku || row.name.replace(/\s+/g, '_')}`,
                supplierId: editingSupplier.id,
                sku: row.sku,
                name: row.name,
                uom: row.uom,
                packSize: parseFloat(row.packSize),
                priceExVat: parseFloat(row.priceExVat),
                vatRate: row.vatRate ? parseFloat(row.vatRate) : undefined,
                lastUpdated: new Date().toISOString()
            };
        });

        const res = await fetch('/api/supplier-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemsToUpsert),
        });

        if (!res.ok) throw new Error('CSV import failed');
        toast({ title: 'Success', description: `Imported ${itemsToUpsert.length} items.` });
        setIsCsvDialogOpen(false);
        setCsvData('');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <AdminLayout title="Suppliers">
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditingSupplier({}); setIsDialogOpen(true); }}><PlusCircle className="mr-2" /> New Supplier</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Suppliers</CardTitle>
          <CardDescription>A list of vendors for purchasing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow> : suppliers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No suppliers created yet.</TableCell></TableRow> : suppliers.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingSupplier(s); setIsDialogOpen(true); }}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditingSupplier(s); setIsCsvDialogOpen(true); }}>Import Catalog</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupplier?.id ? 'Edit Supplier' : 'New Supplier'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Name" value={editingSupplier?.name || ''} onChange={e => setEditingSupplier(s => ({ ...s, name: e.target.value }))} />
            <Input placeholder="Email" value={editingSupplier?.email || ''} onChange={e => setEditingSupplier(s => ({ ...s, email: e.target.value }))} />
            <Input placeholder="Phone" value={editingSupplier?.phone || ''} onChange={e => setEditingSupplier(s => ({ ...s, phone: e.target.value }))} />
            <Input placeholder="Address" value={editingSupplier?.address || ''} onChange={e => setEditingSupplier(s => ({ ...s, address: e.target.value }))} />
            <Input type="number" step="0.01" placeholder="Default VAT Rate (e.g., 0.15)" value={editingSupplier?.vatRate || ''} onChange={e => setEditingSupplier(s => ({ ...s, vatRate: parseFloat(e.target.value) }))} />
            <Textarea placeholder="Notes" value={editingSupplier?.notes || ''} onChange={e => setEditingSupplier(s => ({ ...s, notes: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Catalog for {editingSupplier?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Paste CSV data with headers: sku,name,uom,packSize,priceExVat,vatRate</p>
          <Textarea rows={10} value={csvData} onChange={e => setCsvData(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCsvDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleImportCsv} disabled={isUploading}>{isUploading ? "Importing..." : "Import"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
