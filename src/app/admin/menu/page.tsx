
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function MenuPage() {
  return (
    <AdminLayout title="Menu Management">
      <Card className="bg-brand-card border-brand-line">
        <div className="p-4 border-b border-brand-line">
          <h2 className="text-xl font-semibold">Menu Management</h2>
          <p className="text-brand-mute">This section is under construction.</p>
        </div>
        <div className="p-4">
          <p className="text-brand-mute mb-4">
            Soon, you'll be able to manage products, categories, and modifiers directly from this interface.
            For now, please use the CSV import/export tool.
          </p>
          <Button asChild variant="secondary">
            <Link href="/admin/menu/import-export">Go to Import/Export</Link>
          </Button>
        </div>
      </Card>
    </AdminLayout>
  );
}
