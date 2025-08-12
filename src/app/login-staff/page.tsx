'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { loginStaff, type StaffLoginState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinPad } from '@/components/pin-pad';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';

export default function StaffLoginPage() {
  const initialState: StaffLoginState = { error: null };
  const [state, dispatch] = useFormState(loginStaff, initialState);
  const { pending } = useFormStatus();

  const [pin, setPin] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  type QuickUser = { id: string; name: string; pin?: string | null };
  const [quickUsers, setQuickUsers] = useState<QuickUser[]>([]);

  // Subscribe to active staff for quick select (show only those with a 4-digit pin)
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('active', '==', true),
      orderBy('name'),
      limit(24)
    );

    const unsub = onSnapshot(q, (snap) => {
      const results: QuickUser[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const pinVal = data?.pin ?? null;
        if (typeof pinVal === 'string' && /^\d{4}$/.test(pinVal)) {
          results.push({ id: d.id, name: data?.name ?? d.id, pin: pinVal });
        }
      });
      setQuickUsers(results);
    }, () => {
      // ignore errors (rules/app check); list simply won't render
      setQuickUsers([]);
    });

    return () => unsub();
  }, []);

  // Automatically submit the form when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4 && formRef.current && !pending) {
      formRef.current.requestSubmit();
    }
  }, [pin, pending]);

  // Clear PIN on error
  useEffect(() => {
    if (state.error) {
      setPin('');
    }
  }, [state.error])

  function handleQuickSelect(user: QuickUser) {
    if (user.pin && typeof user.pin === 'string' && /^\d{4}$/.test(user.pin)) {
      setPin(user.pin);
      // submission will auto-trigger via effect
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <Button variant="ghost" asChild className="absolute top-4 left-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Staff Login</CardTitle>
            <CardDescription>Enter your 4-digit PIN to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={dispatch} className="space-y-6">
              <input type="hidden" name="pin" value={pin} />
              <PinPad pin={pin} setPin={setPin} isPending={pending} />
              {quickUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Quick select</div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickUsers.map((user) => (
                      <Button key={user.id} type="button" variant="secondary" onClick={() => handleQuickSelect(user)} disabled={pending || !user.pin}>
                        {user.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {state.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
