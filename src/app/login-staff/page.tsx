'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StaffGrid from "@/components/login/StaffGrid";
import PinPad from "@/components/login/PinPad";
import type { User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { routeForRole } from '@/lib/roles';

// Mock session management
const setSession = (user: { uid: string, name: string, role: string }) => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('mockUser', JSON.stringify(user));
    }
};

export default function StaffLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.focus();
    }
  }, []);

  const press = (key: string) => {
    if (submitting) return;
    if (key === 'C') {
      setPin('');
      return;
    }
    if (pin.length < 4) {
      setPin(p => p + key);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      press(e.key);
    } else if (e.key === 'Backspace') {
      setPin(p => p.slice(0, -1));
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  }

  const handleSubmit = useCallback(async () => {
    if (!selectedUser || pin.length !== 4 || submitting) {
      if (!selectedUser) setError("Please select a user.");
      if (pin.length !== 4) setError("PIN must be 4 digits.");
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
        
        setSession({ uid: data.uid, name: data.name, role: data.role });
        router.push(routeForRole(data.role));

    } catch (e) {
        setError((e as Error).message);
    } finally {
        setSubmitting(false);
        setPin('');
        didSubmitRef.current = false;
    }
  }, [pin, router, selectedUser, submitting]);

  // Effect to automatically submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4 && selectedUser && !didSubmitRef.current) {
        handleSubmit();
    }
  }, [pin, selectedUser, handleSubmit]);


  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="min-h-screen bg-brand-bg text-brand-text focus:outline-none"
    >
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-3">
        <img src="/logo-hugepos.svg" alt="HugePOS" className="h-8 w-auto hidden sm:block" />
        <h1 className="text-2xl font-bold tracking-tight">HugePOS</h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-10 grid gap-8 md:grid-cols-2">
        <section className="rounded-2xl border border-brand-line bg-brand-card p-5">
          <h2 className="text-lg font-semibold mb-3">Select user</h2>
          {loading ? (
            <div className="text-sm text-brand-mute">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-brand-mute">
              No users found.
            </div>
          ) : (
            <StaffGrid
              users={users}
              selected={selectedUser?.id.toString() || ''}
              onSelect={(id) => {
                const user = users.find(u => u.id.toString() === id);
                if (user) handleSelectUser(user);
              }}
              disabled={submitting}
            />
          )}
        </section>
        
        <div>
            <PinPad
                pin={pin}
                maxLen={4}
                submitting={submitting}
                err={error ?? undefined}
                onKey={press}
                onSubmit={handleSubmit}
            />
        </div>
      </main>
    </div>
  );
}
