import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WaiterDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Waiter Dashboard</CardTitle>
            <CardDescription>Placeholder screen for order taking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">Back to Home</Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
