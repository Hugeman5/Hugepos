
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { routeForRole } from '@/lib/roles';
import { type User } from '@/lib/data';

import Avatar from '@/components/ui/Avatar';
import { Card } from '@/components/ui/card';
import Keypad from '@/components/ui/Keypad';
import { setSessionUser } from '@/lib/session';

export default function StaffLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const didSubmitRef = useRef(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/mock-auth/active-users', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch users');
        const activeUsers: User[] = await res.json();
        setUsers(activeUsers);
      } catch (e) {
        console.error("Could not load users for PIN login", e);
        toast({ variant: 'destructive', title: 'Network Error', description: 'Could not load users.'})
      }
      setLoading(false);
    }
    fetchUsers();
  }, [toast]);
  
  const pressKey = (key: string) => {
    if (submitting) return;
    if (key === 'C') {
      setPin('');
      setError(null);
      return;
    }
    if (key === '↵') {
        handleSubmit();
        return;
    }
    if (pin.length < 4) {
      setPin(p => p + key);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  }

  const handleSubmit = useCallback(async () => {
    if (!selectedUser || pin.length !== 4) {
      if (!selectedUser) setError("Please select a user.");
      else if (pin.length !== 4) setError("PIN must be 4 digits.");
      return;
    }

    setSubmitting(true);
    didSubmitRef.current = true;
    setError(null);

    try {
        const res = await fetch('/api/mock-auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: selectedUser.id, pin: pin })
        });
        
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Invalid credentials.');
        }
        
        setSessionUser({ id: data.uid, name: data.name, role: data.role, hourlyRate: data.hourlyRate });
        router.push(routeForRole(data.role));

    } catch (e) {
        setError((e as Error).message);
    } finally {
        setSubmitting(false);
        setPin('');
        didSubmitRef.current = false;
    }
  }, [pin, router, selectedUser]);

  useEffect(() => {
    if (pin.length === 4 && selectedUser && !didSubmitRef.current) {
        handleSubmit();
    }
  }, [pin, selectedUser, handleSubmit]);


  return (
    <div className="min-h-screen bg-[--bg] text-[--text] px-6 py-8">
      <header className="max-w-6xl mx-auto flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">HugePOS</h1>
      </header>

      <main className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4 text-[--text-dim]">Select User</h2>
          {loading ? (
            <div className="text-sm text-[--text-dim]">Loading users…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {users.map(user => (
                <button 
                  key={user.id} 
                  data-testid={`user-card-${user.id}`}
                  onClick={() => handleSelectUser(user)}
                  disabled={submitting}
                  className={`p-3 rounded-2xl border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                              ${selectedUser?.id === user.id ? 'border-[--accent] ring-2 ring-[--accent]' : 'border-[--line] hover:border-[--accent]'}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Avatar name={user.name} src={(user as any).imageUrl} size={84} />
                    <div className="text-center">
                      <div className="font-semibold text-[--text]">{user.name}</div>
                      <div className="text-xs text-[--text-dim] capitalize">{user.role}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
        
        <Card className="p-5">
             <h2 className="text-lg font-semibold mb-4 text-[--text-dim]">Enter PIN</h2>
             <div className="flex justify-center items-center gap-3 h-10 mb-6">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className={`h-4 w-4 rounded-full ${i < pin.length ? 'bg-[--accent]' : 'bg-[--muted]'}`} />
                ))}
             </div>
             {error && <p className="text-center text-[--danger] mb-4">{error}</p>}
             <Keypad onPress={pressKey} disabled={!selectedUser || submitting} />
        </Card>
      </main>
    </div>
  );
}
