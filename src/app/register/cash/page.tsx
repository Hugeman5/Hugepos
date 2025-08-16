'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Landmark } from 'lucide-react';
import Link from 'next/link';

export default function CashPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<'payin' | 'payout'>('payin');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For this simple example, we'll mock the user. In a real app, this would come from a session.
  const user = { id: 'jcashier', name: 'John Cashier' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) {
        toast({ variant: 'destructive', title: 'Error', description: 'Amount and reason are required.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/register/cash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                amount: parseFloat(amount),
                reason,
                user
            })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to process cash movement.');
        }
        toast({ title: 'Success', description: `Successfully processed ${type} of $${amount}.` });
        router.push('/cashier'); // Or back to a register menu
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
         <Button variant="ghost" asChild className="absolute top-4 left-4">
          <Link href="/register/close">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Cash In / Out</CardTitle>
            <CardDescription>Record a cash payment in or out of the drawer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Button type="button" variant={type === 'payin' ? 'default' : 'outline'} onClick={() => setType('payin')}>
                        Pay In
                    </Button>
                     <Button type="button" variant={type === 'payout' ? 'default' : 'outline'} onClick={() => setType('payout')}>
                        Pay Out
                    </Button>
                </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  name="reason"
                  placeholder="e.g., Office supplies, float top-up"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Movement'} <Landmark className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
