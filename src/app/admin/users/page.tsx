
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import { type User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlusCircle } from 'lucide-react';

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

  useEffect(() => {
    const fetchUsers = async () => {
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
    fetchUsers();
  }, [toast]);

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
      key: 'active', 
      label: 'Status',
      render: (user: User) => (
        <Badge variant={user.active ? 'default' : 'outline'} className={user.active ? 'bg-green-500/20 text-green-400' : 'bg-transparent text-[--text-dim]'}>
          {user.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    { 
      key: 'exposeOnPinLogin', 
      label: 'On PIN Screen',
      render: (user: User) => user.exposeOnPinLogin ? 'Yes' : 'No'
    },
    { 
      key: 'actions', 
      label: 'Actions',
      align: 'right' as const,
      render: (user: User) => (
        <Link href={`/admin/users/${user.id}/edit`}>
          <Button variant="secondary" className="text-xs py-1 px-3">Edit</Button>
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
          <Button variant="primary">
            <PlusCircle size={16} className="mr-2" />
            New User
          </Button>
        </Link>
      </div>
      {isLoading ? <p>Loading users...</p> : <DataTable columns={columns} rows={users} />}
    </AdminLayout>
  );
}
