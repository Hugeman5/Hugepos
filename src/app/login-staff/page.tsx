
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { routeForRole } from '@/lib/roles';
import { getActiveUsers, getCachedActiveUsers, postVerify, SafeUser } from '@/api/mockAuth';

import Avatar from '@/components/ui/Avatar';
import { Card } from '@/components/ui/card';
import Keypad from '@/components/ui/Keypad';
import { setSessionUser } from '@/lib/session';
import { Button } from '@/components/ui/Button';

export default function StaffLoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<SafeUser[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const didSubmitRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getActiveUsers();
      setUsers(list);
      if (!list || list.length === 0) {
        setError('No active users found.');
      }
    } catch (e: any) {
      const cached = getCachedActiveUsers();
      if (cached && cached.length > 0) {
        setUsers(cached);
        setError('Network failed. Using cached users.');
      } else {
        setError(e?.data?.error || e?.message || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  
  const pressKey = (key: string) => {
    if (submitting) return;
    if (key === 'C') {
      setPin('');
      setPinError(null);
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

  const handleSelectUser = (user: SafeUser) => {
    setSelectedUser(user);
    setPin('');
    setPinError(null);
  }

  const handleSubmit = useCallback(async () => {
    if (!selectedUser || pin.length !== 4) {
      if (!selectedUser) setPinError("Please select a user.");
      else if (pin.length !== 4) setPinError("PIN must be 4 digits.");
      return;
    }

    setSubmitting(true);
    didSubmitRef.current = true;
    setPinError(null);

    try {
        const data = await postVerify(selectedUser.id, pin);
        
        if (data.ok && data.user) {
          setSessionUser({ id: data.user.id, name: data.user.name, role: data.user.role, hourlyRate: data.user.hourlyRate });
          router.push(routeForRole(data.user.role));
        } else {
            throw new Error(data.error || 'Invalid credentials.');
        }

    } catch (e: any) {
        setPinError(e.data?.error || e.message || 'Invalid credentials.');
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


  const renderUserSelection = () => {
    if (loading && !users) {
      return <div className="text-sm text-[--text-dim]" data-testid="login-skeleton">Loading users…</div>;
    }

    if (error && (!users || users.length === 0)) {
        return (
            <div data-testid="login-error" className="text-center text-[--danger]">
                <p>{error}</p>
                <Button onClick={load} variant="outline" className="mt-4">Retry</Button>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return <div className="text-sm text-[--text-dim]">No users found.</div>
    }

    return (
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
    );
  }


  return (
    <div className="min-h-screen bg-[--bg] text-[--text] px-6 py-8">
      <header className="max-w-6xl mx-auto flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">HugePOS</h1>
      </header>

      <main className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[--text-dim]">Select User</h2>
                {error && users && users.length > 0 && <div className="text-sm text-[--warning]">{error}</div>}
            </div>
            {renderUserSelection()}
        </Card>
        
        <Card className="p-5">
             <h2 className="text-lg font-semibold mb-4 text-[--text-dim]">Enter PIN</h2>
             <div className="flex justify-center items-center gap-3 h-10 mb-6">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className={`h-4 w-4 rounded-full ${i < pin.length ? 'bg-[--accent]' : 'bg-[--muted]'}`} />
                ))}
             </div>
             {pinError && <p className="text-center text-[--danger] mb-4">{pinError}</p>}
             <Keypad onPress={pressKey} disabled={!selectedUser || submitting} />
        </Card>
      </main>
    </div>
  );
}
