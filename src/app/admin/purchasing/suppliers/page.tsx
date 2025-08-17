
'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { type SupplierItem } from '@/lib/repos/supplierItemsRepo';
import { PlusCircle, Edit, Trash2, Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { getSettings } from '@/lib/settingsRepo';
import { formatMoney } from '@/lib/money';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

function CsvUploadDialog({ supplier, open, onClose, onImported }: { supplier: Supplier, open: boolean, onClose: () => void, onImported: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [vatRate, setVatRate] = useState(supplier.vatRate?.toString() || '');
    const [headers, setHeaders] = useState<string[]>([]);
    
    // Column mappings
    const [colName, setColName] = useState('');
    const [colSku, setColSku] = useState('');
    const [colUom, setColUom] = useState('');
    const [colPackSize, setColPackSize] = useState('');
    const [colPriceEx, setColPriceEx] = useState('');
    const [colPriceInc, setColPriceInc] = useState('');


    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setFile(null);
            setIsUploading(false);
            setError('');
            setVatRate(supplier.vatRate?.toString() || '');
            setHeaders([]);
            setColName('');
            setColSku('');
            setColUom('');
            setColPackSize('');
            setColPriceEx('');
            setColPriceInc('');
        }
    }, [open, supplier]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                preview: 1,
                complete: (results) => {
                    setHeaders(results.meta.fields || []);
                }
            });
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setIsUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('supplierId', supplier.id);
        if (vatRate) formData.append('vatRate', vatRate);
        if (colName) formData.append('colName', colName);
        if (colSku) formData.append('colSku', colSku);
        if (colUom) formData.append('colUom', colUom);
        if (colPackSize) formData.append('colPackSize', colPackSize);
        if (colPriceEx) formData.append('colPriceEx', colPriceEx);
        if (colPriceInc) formData.append('colPriceInc', colPriceInc);

        try {
            const res = await fetch('/api/supplier-items/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            toast({ title: 'Import Successful', description: `Imported ${data.imported} items for ${supplier.name}.` });
            onImported();
            onClose();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsUploading(false);
        }
    };
    
    const renderMappingSelect = (label: string, value: string, setter: (val: string) => void) => (
        <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">{label}</Label>
            <Select value={value} onValueChange={setter}>
                <SelectTrigger className="col-span-2"><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Import Catalog for {supplier.name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                    <div>
                        <Label htmlFor="vat-rate">Default VAT Rate</Label>
                        <Input id="vat-rate" type="number" step="0.01" value={vatRate} onChange={e => setVatRate(e.target.value)} placeholder="e.g. 0.15 for 15%"/>
                    </div>
                    {headers.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <h4 className="font-semibold">Column Mapping (Optional)</h4>
                            <p className="text-xs text-muted-foreground">Override auto-detection if your column names are unusual.</p>
                            {renderMappingSelect('Name/Description', colName, setColName)}
                            {renderMappingSelect('SKU/Code', colSku, setColSku)}
                            {renderMappingSelect('Unit of Measure', colUom, setColUom)}
                            {renderMappingSelect('Pack Size', colPackSize, setColPackSize)}
                            {renderMappingSelect('Price (Ex. VAT)', colPriceEx, setColPriceEx)}
                            {renderMappingSelect('Price (Inc. VAT)', colPriceInc, setColPriceInc)}
                        </div>
                    )}
                    {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={isUploading || !file}>{isUploading ? 'Uploading...' : 'Upload & Import'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const res = await fetch('/api/suppliers', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch suppliers');
        setSuppliers(await res.json());
    } catch(e) {
        setError((e as Error).message);
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No suppliers created yet.</TableCell></TableRow> : suppliers.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => { setEditingSupplier(s); setIsDialogOpen(true); }}><Edit className="h-3 w-3 mr-1"/> Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditingSupplier(s); setIsCsvDialogOpen(true); }}><Upload className="h-3 w-3 mr-1"/> Import Catalog</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="h-3 w-3"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
      
      {editingSupplier && (
        <CsvUploadDialog
            supplier={editingSupplier as Supplier}
            open={isCsvDialogOpen}
            onClose={() => setIsCsvDialogOpen(false)}
            onImported={fetchData}
        />
      )}
    </AdminLayout>
  );
}
