
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import { type User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlusCircle, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';

const getRoleBadgeClass = (role: User['role']) => {
  switch (role.toLowerCase()) {
    case 'admin': return 'bg-[--accent] text-black';
    case 'manager': return 'bg-yellow-500/80 text-black';
    case 'cashier':
    default: return 'bg-sky-500/80 text-white';
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);
  
  const handleRateChange = (userId: string, value: string) => {
    setEditingRates(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveRate = async (userId: string) => {
    const rate = editingRates[userId];
    if (rate === undefined || isNaN(parseFloat(rate))) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter a valid number for the hourly rate.' });
      return;
    }
    setSavingRate(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hourlyRate: parseFloat(rate) })
      });
      if (!res.ok) throw new Error('Failed to update rate');
      toast({ title: 'Success', description: 'Hourly rate updated.' });
      setEditingRates(prev => {
          const next = {...prev};
          delete next[userId];
          return next;
      });
      await fetchUsers();
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setSavingRate(null);
    }
  }


  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={40} />
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-[--text-dim]">{user.id}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role',
      render: (user: User) => (
        <Badge className={cn('capitalize', getRoleBadgeClass(user.role))}>{user.role}</Badge>
      )
    },
    {
      key: 'hourlyRate',
      label: 'Hourly Rate (ZAR)',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Input 
            type="number"
            className="w-24 h-8"
            value={editingRates[user.id] ?? user.hourlyRate ?? '0'}
            onChange={(e) => handleRateChange(user.id, e.target.value)}
            disabled={savingRate === user.id}
          />
          {(editingRates[user.id] !== undefined && editingRates[user.id] != (user.hourlyRate ?? 0)) && (
             <Button size="icon" className="h-8 w-8" onClick={() => handleSaveRate(user.id)} disabled={savingRate === user.id}>
              {savingRate === user.id ? '...' : <Save className="h-4 w-4"/>}
             </Button>
          )}
        </div>
      )
    },
    { 
      key: 'active', 
      label: 'Status',
      render: (user: User) => (
        <Badge variant={user.active ? 'default' : 'outline'} className={user.active ? 'bg-green-500/20 text-green-400' : 'bg-transparent text-[--text-dim]'}>
          {user.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions',
      align: 'right' as const,
      render: (user: User) => (
        <Link href={`/admin/users/${user.id}/edit`}>
          <Button variant="secondary" className="text-xs py-1 px-3">Edit Profile</Button>
        </Link>
      )
    }
  ];

  return (
    <AdminLayout title="User Management">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Staff Members</h2>
          <p className="text-[--text-dim]">Manage your staff accounts and permissions.</p>
        </div>
        <Link href="/admin/users/new/edit">
          <Button>
            <PlusCircle size={16} className="mr-2" />
            New User
          </Button>
        </Link>
      </div>
      {isLoading ? <p>Loading users...</p> : <DataTable columns={columns} rows={users} />}
    </AdminLayout>
  );
}
