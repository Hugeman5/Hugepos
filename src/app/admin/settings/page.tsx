import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <AdminLayout title="Settings">
      <Card className="bg-brand-card border-brand-line">
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription className="text-brand-mute">This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-brand-mute">
            Configuration for outlets, registers, taxes, and receipt templates will be available here in a future update.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
