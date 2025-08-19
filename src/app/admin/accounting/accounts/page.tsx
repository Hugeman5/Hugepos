
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { type Account } from '@/lib/repos/accountsRepo';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/admin/accounts');
                if (!res.ok) throw new Error('Failed to fetch accounts');
                const data = await res.json();
                setAccounts(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    return (
        <AdminLayout title="Chart of Accounts">
            <Card>
                <CardHeader>
                    <CardTitle>Chart of Accounts</CardTitle>
                    <CardDescription>
                        This is a simplified view of your accounting ledger. Full management will be available in a future update.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <p>Loading...</p> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="font-mono">{acc.code}</TableCell>
                                        <TableCell>{acc.name}</TableCell>
                                        <TableCell className="capitalize">{acc.type}</TableCell>
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
