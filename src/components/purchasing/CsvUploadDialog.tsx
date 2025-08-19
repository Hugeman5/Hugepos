
'use client';
import { useState, useEffect } from 'react';
import { type Supplier } from '@/lib/repos/suppliersRepo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

export default function CsvUploadDialog({ supplier, open, onClose, onImported }: {
    supplier: Supplier,
    open: boolean,
    onClose: () => void,
    onImported: () => void
}) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
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
            setHeaders([]);
            setColName('');
            setColSku('');
            setColUom('');
            setColPackSize('');
            setColPriceEx('');
            setColPriceInc('');
        }
    }, [open]);

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
        if (colName) formData.append('colName', colName);
        if (colSku) formData.append('colSku', colSku);
        if (colUom) formData.append('colUom', colUom);
        if (colPackSize) formData.append('colPackSize', colPackSize);
        if (colPriceEx) formData.append('colPriceEx', colPriceEx);
        if (colPriceInc) formData.append('colPriceInc', colPriceInc);

        try {
            const res = await fetch(`/api/admin/suppliers/${supplier.id}/catalog/upload`, { method: 'POST', body: formData });
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
