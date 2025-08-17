
'use client';
import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const IMPORT_ENDPOINTS: Record<string, string> = {
    items: '/api/menu/import/items',
    modifiers: '/api/menu/import/modifiers',
    menu: '/api/menu/import/menu',
    price_list: '/api/menu/import/price-list',
};

const EXPORT_ENDPOINTS: Record<string, string> = {
    items: '/api/menu/export/items',
    modifiers: '/api/menu/export/modifiers',
    menu: '/api/menu/export/menu',
    price_list: '/api/menu/export/price-list?listId=default',
};

const FILENAMES: Record<string, string> = {
    items: 'items-export.csv',
    modifiers: 'modifiers-export.csv',
    menu: 'menu-export.csv',
    price_list: 'price-list-export.csv',
}

function ImportExportTab({ dataType }: { dataType: string }) {
    const { toast } = useToast();
    const [csvData, setCsvData] = useState('');
    const [isDryRun, setIsDryRun] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await fetch(EXPORT_ENDPOINTS[dataType]);
            if (!res.ok) throw new Error(`Failed to export ${dataType}`);
            const text = await res.text();
            downloadFile(text, FILENAMES[dataType], 'text/csv');
            toast({ title: 'Success', description: `${dataType} exported successfully.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Export Error', description: (error as Error).message });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleImport = async () => {
        setIsImporting(true);
        try {
            const res = await fetch(IMPORT_ENDPOINTS[dataType], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csv: csvData, dryRun: isDryRun }),
            });
            
            const result = await res.json();
            if (!res.ok) {
                if (result.errors) {
                     toast({ variant: 'destructive', title: 'Import Validation Error', description: result.errors.join('\\n') });
                } else {
                    throw new Error(result.message || `Failed to import ${dataType}`);
                }
            } else {
                toast({ title: 'Import Successful', description: `Upserted ${result.upserted} ${dataType}.` });
            }

        } catch(error) {
            toast({ variant: 'destructive', title: 'Import Error', description: (error as Error).message });
        } finally {
            setIsImporting(false);
        }
    }
    
    return (
        <Card className="bg-brand-card border-brand-line">
            <div className="p-4 border-b border-brand-line">
                <h2 className="text-xl font-semibold capitalize">{dataType}</h2>
                <p className="text-brand-mute">
                    Export current {dataType} as a CSV file, or import a CSV file to bulk add/update {dataType}.
                </p>
            </div>
            <div className="p-4 space-y-4">
                <Button onClick={handleExport} disabled={isExporting} variant="secondary">
                    <Download className="mr-2" /> {isExporting ? 'Exporting...' : `Export ${dataType}`}
                </Button>
                <div className="border-t pt-4 space-y-2 border-brand-line">
                    <Label htmlFor={`${dataType}-textarea`}>CSV Data to Import</Label>
                    <Textarea 
                        id={`${dataType}-textarea`}
                        rows={10} 
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        placeholder={`Paste your CSV data for ${dataType} here...`}
                        className="font-mono text-xs"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id={`${dataType}-dryrun`} checked={isDryRun} onCheckedChange={(checked) => setIsDryRun(!!checked)} />
                    <Label htmlFor={`${dataType}-dryrun`}>Dry Run (validate without saving)</Label>
                </div>
                <Button onClick={handleImport} disabled={isImporting || !csvData} className="bg-brand-accent">
                    <Upload className="mr-2" /> {isImporting ? 'Importing...' : `Import ${dataType}`}
                </Button>
            </div>
        </Card>
    )
}

export default function ImportExportPage() {
  return (
    <AdminLayout title="Menu Import/Export">
        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="modifiers" disabled>Modifiers (Coming Soon)</TabsTrigger>
            <TabsTrigger value="menu" disabled>Menu Screens (Coming Soon)</TabsTrigger>
            <TabsTrigger value="price_lists" disabled>Price Lists (Coming Soon)</TabsTrigger>
          </TabsList>
          <TabsContent value="items" className="mt-4">
              <ImportExportTab dataType="items" />
          </TabsContent>
        </Tabs>
    </AdminLayout>
  );
}
