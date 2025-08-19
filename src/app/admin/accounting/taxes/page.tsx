
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { type TaxRate } from '@/lib/repos/taxesRepo';
import { Button } from '@/components/ui/Button';

export default function TaxesPage() {
    const [taxes, setTaxes] = useState<TaxRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/admin/taxes');
                if (!res.ok) throw new Error('Failed to fetch tax rates');
                const data = await res.json();
                setTaxes(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    return (
        <AdminLayout title="Tax Rates">
            <Card>
                <CardHeader>
                    <CardTitle>Tax Rates</CardTitle>
                    <CardDescription>
                        Manage tax rates for your region. This is a simplified view.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <p>Loading...</p> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {taxes.map(tax => (
                                    <TableRow key={tax.id}>
                                        <TableCell className="font-mono">{tax.id}</TableCell>
                                        <TableCell>{tax.name}</TableCell>
                                        <TableCell>{tax.country}</TableCell>
                                        <TableCell className="text-right">{(tax.rate * 100).toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
