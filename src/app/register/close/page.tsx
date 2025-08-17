
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DoorClosed, LandPlot, Minus, Plus, Banknote } from 'lucide-react';
import Link from 'next/link';
import { type Shift } from '@/lib/data';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';


export default function CloseRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actualCash, setActualCash] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const user = { id: 'jcashier', name: 'John Cashier' };

  useEffect(() => {
    async function getOpenShift() {
      try {
        const [shiftRes, settingsRes] = await Promise.all([
            fetch('/api/register/open-shift'),
            fetch('/api/settings'),
        ]);
        
        if (shiftRes.ok) {
          const data = await shiftRes.json();
          setShift(data);
        } else {
          setShift(null);
        }
        if (settingsRes.ok) {
            setSettings(await settingsRes.json());
        }

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load shift details.' });
      } finally {
        setIsLoading(false);
      }
    }
    getOpenShift();
  }, [toast]);
  
  const money = (value: number) => {
    if (!settings) return `...`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  const handleCloseShift = async () => {
    if (!actualCash) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter the actual cash amount.' });
      return;
    }
    setIsClosing(true);
    try {
      const res = await fetch('/api/register/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashActual: parseFloat(actualCash),
          user,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to close shift.');
      }
      toast({ title: 'Shift Closed', description: `Shift ${data.shiftId} has been closed. Report generated.` });
      router.push(`/admin/reports/register/${data.shiftId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsClosing(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!shift) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">No Active Shift</h2>
          <p className="text-muted-foreground">There is no register shift currently open.</p>
          <Button asChild className="mt-4">
            <Link href="/register/open">Open a Register</Link>
          </Button>
        </div>
      </div>
    );
  }

  const difference = parseFloat(actualCash) - (shift.cashExpected || 0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Close Register</CardTitle>
            <p className="text-brand-mute">Review totals and enter final cash count to close the shift.</p>
          </CardHeader>
          <CardContent className="p-4 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Actions</h3>
                <Button className="w-full justify-start" variant="secondary" asChild><Link href="/cashier"><LandPlot className="mr-2"/> Back to Sales</Link></Button>
                <Button className="w-full justify-start" variant="secondary" asChild><Link href="/register/cash"><Plus className="mr-2"/> Pay In</Link></Button>
                <Button className="w-full justify-start" variant="secondary" asChild><Link href="/register/cash"><Minus className="mr-2"/> Pay Out</Link></Button>
            </div>
            
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg">Shift Summary</h3>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Starting Float</span>
                    <span>{money(shift.floatAmount)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Card Payments</span>
                    <span>{money(shift.cardPayments || 0)}</span>
                 </div>
                 <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Expected Cash</span>
                    <span>{money(shift.cashExpected || 0)}</span>
                 </div>
                 
                 <div className="space-y-2 pt-4">
                    <Label htmlFor="actualCash">Actual Cash in Drawer</Label>
                    <Input id="actualCash" type="number" step="0.01" value={actualCash} onChange={(e) => setActualCash(e.target.value)} />
                 </div>
                 
                {actualCash && (
                     <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Difference</span>
                        <span className={difference === 0 ? '' : 'text-destructive'}>{money(difference)}</span>
                     </div>
                )}
                 
                 <Button className="w-full" size="lg" disabled={isClosing || !actualCash} onClick={handleCloseShift}>
                    {isClosing ? "Closing..." : "Close Shift"} <DoorClosed className="ml-2"/>
                 </Button>

            </div>

          </CardContent>
        </Card>
      </div>
    </main>
  );
}
