'use client';

import { useState, useEffect, useRef, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff, type StaffLoginState } from '@/lib/actions';
import StaffGrid from "@/components/login/StaffGrid";
import PinPad from "@/components/login/PinPad";
import type { User } from '@/lib/data';


export default function StaffLoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const initialState: StaffLoginState = { error: null };
  const [state, dispatch] = useActionState(loginStaff, initialState);
  
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const allUsers: User[] = await res.json();
        const activeUsers = allUsers.filter(u => u.active && u.exposeOnPinLogin);
        setUsers(activeUsers);
      } catch (e) {
        console.error("Could not load users for PIN login", e);
        // In a real app, show a toast.
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

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
      if (formRef.current) {
          formRef.current.requestSubmit();
      }
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
  }

  // Effect to automatically submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4 && selectedUser && formRef.current && !submitting) {
        setSubmitting(true);
        formRef.current.requestSubmit();
    }
  }, [pin, selectedUser, submitting]);

  // Effect to handle form submission result
  useEffect(() => {
    if (state.error) {
        setPin('');
        setSubmitting(false);
    }
    // Successful login is handled by redirect in server action
  }, [state.error]);


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
                if (user) {
                    handleSelectUser(user);
                    if (state) state.error = null;
                }
              }}
              disabled={submitting}
            />
          )}
        </section>
        
        <form action={dispatch} ref={formRef}>
            <input type="hidden" name="pin" value={pin} />
            <input type="hidden" name="userId" value={selectedUser?.id || ''} />
             <PinPad
                pin={pin}
                maxLen={4}
                submitting={submitting}
                err={state.error ?? undefined}
                onKey={press}
                onSubmit={() => {
                   if (formRef.current && selectedUser) {
                        setSubmitting(true);
                        formRef.current.requestSubmit();
                   }
                }}
            />
        </form>
      </main>
    </div>
  );
}
