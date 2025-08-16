import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MenuPage() {
  return (
    <AdminLayout title="Menu Management">
      <Card className="bg-brand-card border-brand-line">
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription className="text-brand-mute">This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-brand-mute mb-4">
            Soon, you'll be able to manage products, categories, and modifiers directly from this interface.
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
