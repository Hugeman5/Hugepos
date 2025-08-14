'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setSession } from '@/lib/session';

const MAX_PIN = 4;

export default function LoginUnifiedPage() {
  const [users, setUsers] = useState<Array<{id:string; name:string; role:string; active:boolean}>>([]);
  const [selected, setSelected] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canLogin = !!selected && pin.length === MAX_PIN && !submitting;

  useEffect(() => {
    fetch('/api/mock-auth/active-users')
      .then(r => r.json())
      .then((list) => {
        setUsers(list);
        if (!selected && Array.isArray(list) && list.length > 0) setSelected(String(list[0].id));
      })
      .catch(()=>setUsers([]));
  }, []);

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!canLogin) return;
    setSubmitting(true);
    setError(null);
    try {
      console.log('LOGIN submit', { identifier: selected, pin });
      const res = await fetch('/api/mock-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: selected, pin })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(String(data?.error || 'Invalid PIN'));
        setPin('');
        setSubmitting(false);
        return;
      }
      setSession({ uid: String(data.uid), name: String(data.name), role: String(data.role) });
      window.location.assign(`/${String(data.role).toLowerCase() === 'admin' ? 'admin' : `dashboard-${String(data.role).toLowerCase()}`}`);
    } catch (err) {
      setError('Network error');
      setSubmitting(false);
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
              <select id="identifier" className="border h-10 rounded px-2 w-full" value={selected} onChange={(e)=>{ setSelected(e.target.value); setError(null); }} required>
                {users.map(u=> (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input id="pin" type="password" value={pin} onChange={(e)=>{ const v=e.target.value.replace(/\D/g,'').slice(0, MAX_PIN); setPin(v); setError(null); }} maxLength={MAX_PIN} placeholder="••••" />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!canLogin}>{submitting ? 'Verifying...' : 'Login'}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}