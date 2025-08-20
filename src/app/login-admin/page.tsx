
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogIn } from 'lucide-react';
import { loginAdmin, type AdminLoginState } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'} <LogIn className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const initialState: AdminLoginState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(loginAdmin, initialState);

  useEffect(() => {
    if (state.success && state.redirectUrl) {
        router.push(state.redirectUrl);
    }
  }, [state, router]);
 
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[--bg] text-[--text]">
      <div className="w-full max-w-md">
        <Link href="/">
            <Button variant="secondary" className="absolute top-4 left-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
            </Button>
        </Link>
        <Card>
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold text-[--accent]">Admin Login</h1>
            <p className="text-[--text-dim]">Enter your credentials to access the admin dashboard.</p>
          </div>
          <div className="p-6 pt-0">
            <form action={dispatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="admin" required className="bg-[--muted] border-[--line] rounded-xl px-3 py-2" />
                 {state.errors?.username && (
                  <p className="text-sm font-medium text-[--danger]">{state.errors.username[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="admin@hugepos.com" required className="bg-[--muted] border-[--line] rounded-xl px-3 py-2" />
                 {state.errors?.email && (
                  <p className="text-sm font-medium text-[--danger]">{state.errors.email[0]}</p>
                )}
              </div>

               {state.message && (
                 <div className="p-3 rounded-lg bg-[--danger]/10 text-center text-[--danger]">
                   <h3 className="font-semibold">Login Failed</h3>
                   <p className="text-sm">{state.message}</p>
                 </div>
              )}
              
              <LoginButton />
            </form>
          </div>
        </Card>
      </div>
    </main>
  );
}
