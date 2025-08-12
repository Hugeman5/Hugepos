'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, User2 } from 'lucide-react';
import { loginStaff, type StaffLoginState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinPad } from '@/components/pin-pad';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export default function StaffLoginPage() {
  const initialState: StaffLoginState = { error: null };
  const [state, dispatch] = useFormState(loginStaff, initialState);
  const { pending } = useFormStatus();

  const [pin, setPin] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  type QuickUser = { id: string; name: string; pin?: string | null };
  const [quickUsers, setQuickUsers] = useState<QuickUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Subscribe to active staff for quick select (only with 4-digit pin)
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('active', '==', true), orderBy('name'), limit(48));

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
      setLoadingUsers(false);
    }, () => {
      setQuickUsers([]);
      setLoadingUsers(false);
    });

    return () => unsub();
  }, []);

  // Auto-submit when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4 && formRef.current && !pending) {
      formRef.current.requestSubmit();
    }
  }, [pin, pending]);

  // Clear PIN on error
  useEffect(() => {
    if (state.error) setPin('');
  }, [state.error])

  function handleQuickSelect(user: QuickUser) {
    if (user.pin && /^\d{4}$/.test(user.pin)) {
      setPin(user.pin);
    }
  }

  function InitialAvatar({ name }: { name: string }) {
    const initials = (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {initials}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md relative">
        <Button variant="ghost" asChild className="absolute -top-2 -left-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-headline text-primary tracking-tight">Staff Login</CardTitle>
            <CardDescription className="text-muted-foreground">Select your name or enter your 4‑digit PIN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form ref={formRef} action={dispatch} className="space-y-6">
              <input type="hidden" name="pin" value={pin} />

              {/* Quick users grid */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Team</div>
                {loadingUsers ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : quickUsers.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {quickUsers.map((user) => (
                      <Button
                        key={user.id}
                        type="button"
                        variant="secondary"
                        onClick={() => handleQuickSelect(user)}
                        disabled={pending}
                        className="justify-start h-10 px-2"
                        title={user.name}
                      >
                        <InitialAvatar name={user.name} />
                        <span className="ml-2 line-clamp-1 text-left">{user.name}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No active staff with PINs found.</div>
                )}
              </div>

              {/* PIN pad */}
              <div className="space-y-2">
                <div className="text-sm font-medium">PIN</div>
                <PinPad pin={pin} setPin={setPin} isPending={pending} />
              </div>

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
