import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <AdminLayout title="Reports">
      <Card className="bg-brand-card border-brand-line">
        <CardHeader>
          <CardTitle>Reporting & Analytics</CardTitle>
          <CardDescription className="text-brand-mute">This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-brand-mute">
            Detailed sales reports and performance data visualizations will be available here soon.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
