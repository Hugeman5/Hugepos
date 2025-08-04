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


export default function StaffLoginPage() {
  const initialState: StaffLoginState = { error: null };
  const [state, dispatch] = useFormState(loginStaff, initialState);
  const { pending } = useFormStatus();

  const [pin, setPin] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

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
