import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PriceListsPage() {
  return (
    <AdminLayout title="Price Lists">
      <Card className="bg-brand-card border-brand-line">
        <CardHeader>
          <CardTitle>Price List Management</CardTitle>
          <CardDescription className="text-brand-mute">This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-brand-mute mb-4">
            Price list management will be available here in a future update.
            For now, please use the CSV import/export tool.
          </p>
           <Button asChild variant="outline">
            <Link href="/admin/menu/import-export">Go to Import/Export</Link>
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
