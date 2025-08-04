import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Package, BarChart3 } from 'lucide-react';
import DashboardHeader from '@/components/dashboard-header';

const adminNavItems = [
  {
    title: 'User Management',
    description: 'Add, edit, or remove staff members.',
    href: '#',
    icon: <Users className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Product Management',
    description: 'Manage categories, products, and modifiers.',
    href: '#',
    icon: <Package className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Reports & Analytics',
    description: 'View sales reports and performance data.',
    href: '#',
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader title="Admin Dashboard" userName="Admin User" userRole="Admin" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {adminNavItems.map((item) => (
            <Link href={item.href} key={item.title}>
              <Card className="hover:bg-muted/50 transition-colors h-full hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium font-headline">{item.title}</CardTitle>
                  {item.icon}
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, Admin!</CardTitle>
                    <CardDescription>From here you can control every aspect of your FirePOS system. Use the links above to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Future updates will include more detailed reporting and inventory management features right here on this dashboard.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
