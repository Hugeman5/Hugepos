'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginUnifiedPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [users, setUsers] = useState<Array<{id:string; name:string; role:string; active:boolean}>>([]);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const force = useMemo(() => params.get('force') === '1', [params]);

  useEffect(() => {
    fetch('/api/mock-auth/active-users').then(r => r.json()).then(setUsers).catch(()=>setUsers([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/mock-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(String(data?.error ?? 'Login failed'));
        return;
      }
      const role = String(data.role).toLowerCase();
      if (role === 'admin') router.push('/admin');
      else if (role === 'cashier') router.push('/dashboard-cashier');
      else if (role === 'waiter') router.push('/dashboard-waiter');
      else if (role === 'kitchen') router.push('/dashboard-kitchen');
      else setError('Unknown role');
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary">Login</CardTitle>
          <CardDescription>Select your user and enter PIN</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">User</Label>
              <Input list="users" id="identifier" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="e.g., eugene" required />
              <datalist id="users">
                {users.map(u=> (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input id="pin" type="password" value={pin} onChange={(e)=>setPin(e.target.value)} maxLength={6} placeholder="••••" required />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verifying...' : 'Login'}</Button>
          </form>
          {force && users.length > 0 && (
            <div className="mt-4 text-xs text-muted-foreground">Debug: force mode enabled</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}