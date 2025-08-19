
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type Supplier } from '@/lib/repos/suppliersRepo';
import { type SupplierCatalogItem } from '@/lib/repos/supplierCatalogRepo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload } from 'lucide-react';
import CsvUploadDialog from '@/components/purchasing/CsvUploadDialog';
import { formatMoney } from '@/lib/money';

export default function SupplierCatalogPage() {
    const params = useParams();
    const router = useRouter();
    const supplierId = params.id as string;
    const { toast } = useToast();

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [catalog, setCatalog] = useState<SupplierCatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!supplierId) return;
        setIsLoading(true);
        try {
            const [supRes, catRes] = await Promise.all([
                fetch(`/api/admin/suppliers/${supplierId}`),
                fetch(`/api/admin/suppliers/${supplierId}/catalog`)
            ]);

            if (!supRes.ok) {
                toast({ variant: 'destructive', title: 'Error', description: 'Supplier not found.' });
                router.push('/admin/suppliers');
                return;
            }
            setSupplier(await supRes.json());
            
            if (catRes.ok) {
                const catalogData = await catRes.json();
                setCatalog(catalogData.items || []);
            }
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [supplierId, toast, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading || !supplier) {
        return <AdminLayout title="Loading Catalog..."><div>Loading...</div></AdminLayout>
    }

    return (
        <AdminLayout title={`Catalog for ${supplier.name}`}>
             <div className="flex items-center gap-4 mb-4">
                <Button variant="secondary" size="icon" asChild>
                    <Link href="/admin/suppliers"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="font-semibold text-lg md:text-xl">Catalog for {supplier.name}</h1>
                <Button onClick={() => setIsUploadOpen(true)} className="ml-auto"><Upload className="mr-2 h-4 w-4"/> Import CSV</Button>
             </div>
             <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Pack</TableHead>
                                <TableHead className="text-right">Price (Ex. VAT)</TableHead>
                                <TableHead className="text-right">Price (Inc. VAT)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {catalog.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No catalog items found.</TableCell></TableRow>}
                            {catalog.map(item => (
                                <TableRow key={item.sku}>
                                    <TableCell className="font-mono">{item.sku}</TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.purchaseSize} {item.purchaseUom}</TableCell>
                                    <TableCell className="text-right font-mono">{formatMoney(item.priceExVat || 0, "ZAR")}</TableCell>
                                    <TableCell className="text-right font-mono">{formatMoney(item.priceIncVat, "ZAR")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>

             <CsvUploadDialog
                supplier={supplier}
                open={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onImported={() => {
                    fetchData();
                    setIsUploadOpen(false);
                }}
             />
        </AdminLayout>
    )
}
