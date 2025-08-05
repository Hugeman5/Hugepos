'use client';

import { useActionState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, LogIn } from 'lucide-react';
import { loginAdmin, type AdminLoginState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? 'Logging in...' : 'Login'} <LogIn className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function AdminLoginPage() {
  const initialState: AdminLoginState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(loginAdmin, initialState);
 
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Button variant="ghost" asChild className="absolute top-4 left-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={dispatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="admin" required />
                 {state.errors?.username && (
                  <p className="text-sm font-medium text-destructive">{state.errors.username[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="admin@hugepos.com" required />
                 {state.errors?.email && (
                  <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>
                )}
              </div>

               {state.message && (
                 <Alert variant="destructive">
                   <AlertDescription>{state.message}</AlertDescription>
                 </Alert>
              )}
              
              <LoginButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
