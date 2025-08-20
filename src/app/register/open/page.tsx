
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { type Register } from '@/lib/data';
import { DoorOpen } from 'lucide-react';
import { getSession } from '@/lib/session';
import { ensureRegisterOpen } from '@/hooks/useEnsureRegisterOpen';

export default function OpenRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [registers, setRegisters] = useState<Register[]>([]);
  const [selectedRegister, setSelectedRegister] = useState('');
  const [floatAmount, setFloatAmount] = useState('500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const user = getSession();

  useEffect(() => {
    async function fetchRegisters() {
      try {
        const res = await fetch('/api/register/all');
        if (!res.ok) throw new Error('Failed to load registers.');
        const data = await res.json();
        setRegisters(data);
        // Default to first register if available
        if (data.length > 0) {
          setSelectedRegister(data[0].id);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    }
    fetchRegisters();
  }, [toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to open a shift.' });
        return;
    }
    if (!selectedRegister || !floatAmount) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a register and enter a float amount.' });
        return;
    }
    setIsSubmitting(true);
    
    const res = await ensureRegisterOpen(user, selectedRegister, parseFloat(floatAmount));
    if (res.opened) {
        toast({ title: 'Shift Opened', description: `Shift opened on register ${selectedRegister}.` });
        const role = user?.role || 'cashier';
        router.push(role === 'waiter' ? '/waiter' : '/cashier');
    } else if (res.alreadyOpen) {
        toast({ variant: 'destructive', title: 'Already Open', description: 'A shift is already open on this register.' });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
    
    setIsSubmitting(false);
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <div className="p-4 text-center border-b border-brand-line">
            <h2 className="text-2xl font-headline text-primary">Open Register</h2>
            <p className="text-brand-mute">Start a new shift by selecting a register and entering the opening cash float.</p>
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register">Register</Label>
                <Select onValueChange={setSelectedRegister} value={selectedRegister}>
                  <SelectTrigger id="register">
                    <SelectValue placeholder="Select a register..." />
                  </SelectTrigger>
                  <SelectContent>
                    {registers.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="float">Opening Float</Label>
                <Input
                  id="float"
                  name="float"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500.00"
                  value={floatAmount}
                  onChange={(e) => setFloatAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || registers.length === 0}>
                {isSubmitting ? 'Opening...' : 'Open Shift'} <DoorOpen className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </main>
  );
}
