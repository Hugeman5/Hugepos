'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

const getRoleBadgeClass = (role: User['role']) => {
  switch (role.toLowerCase()) {
    case 'admin': return 'bg-brand-accent text-white border-transparent';
    case 'manager': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'cashier':
    default: return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
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
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to delete user');
        }
        toast({ title: 'Success', description: 'User deleted successfully.' });
        fetchUsers(); // Refresh the list
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  }
  
  const handleToggleActive = async (user: User) => {
    const updatedUser = { ...user, active: !user.active };
     try {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to update user status');
        }
        toast({ title: 'Success', description: `User ${updatedUser.active ? 'activated' : 'deactivated'}.` });
        fetchUsers();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  return (
    <AdminLayout title="User Management">
        <Card className="bg-brand-card border-brand-line">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription className="text-brand-mute">Manage your staff accounts and permissions.</CardDescription>
            </div>
            <Button asChild className="bg-brand-accent">
              <Link href="/admin/users/new/edit">
                <PlusCircle /> Add User
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expose on Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                ) : users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name} <span className="text-muted-foreground text-xs">({user.id})</span></TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={cn('capitalize', getRoleBadgeClass(user.role))}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={user.active ? 'default' : 'outline'} className={user.active ? 'bg-brand-ok/20 text-brand-ok border-brand-ok/30' : ''}>
                            {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                    </TableCell>
                    <TableCell>{user.exposeOnPinLogin ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => router.push(`/admin/users/${user.id}/edit`)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleToggleActive(user)}>
                                {user.active ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                               <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                               </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to delete {user.name}?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the user account.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                    Yes, delete user
                                </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </AdminLayout>
  );
}
