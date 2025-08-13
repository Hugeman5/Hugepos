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
import StaffPicker, { type StaffListUser } from '@/components/staff-picker';

export default function StaffLoginPage() {
  const initialState: StaffLoginState = { error: null };
  const [state, dispatch] = useFormState(loginStaff, initialState);
  const { pending } = useFormStatus();

  const [pin, setPin] = useState('');
  const [selected, setSelected] = useState<StaffListUser | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pin.length === 4 && formRef.current && !pending) {
      formRef.current.requestSubmit();
    }
  }, [pin, pending]);

  useEffect(() => {
    if (state.error) {
      setPin('');
    }
  }, [state.error]);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-6 bg-background">
      <div className="w-full max-w-4xl">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Staff Login</CardTitle>
            <CardDescription>Select your user, then enter your 4-digit PIN.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <StaffPicker onSelect={(u) => setSelected(u)} />

              <form ref={formRef} action={dispatch} className="space-y-4">
                <input type="hidden" name="pin" value={pin} />
                <PinPad pin={pin} setPin={setPin} isPending={pending} />
                {selected && (
                  <div className="text-sm text-muted-foreground text-center">Logging in as <span className="font-medium">{selected.name || selected.username}</span></div>
                )}
                {state.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
