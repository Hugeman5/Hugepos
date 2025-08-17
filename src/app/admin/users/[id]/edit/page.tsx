
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/data';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

const userFormSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager', 'cashier', 'waiter', 'kitchen']),
  active: z.boolean(),
  exposeOnPinLogin: z.boolean(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits').optional().or(z.literal('')),
});


export default function UserEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const { id: userId } = params;
  const isNewUser = userId === 'new';

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: '',
      name: '',
      role: 'cashier',
      active: true,
      exposeOnPinLogin: true,
      pin: '',
    }
  });

  useEffect(() => {
    if (!isNewUser) {
      const fetchUser = async () => {
        try {
          const res = await fetch('/api/admin/users');
          if (!res.ok) throw new Error('Failed to fetch users');
          const users: User[] = await res.json();
          const user = users.find(u => u.id === userId);
          if (user) {
            reset(user);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
            router.push('/admin/users');
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
        setIsLoading(false);
    }
  }, [userId, isNewUser, reset, router, toast]);
  
  const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
    try {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to save user.');
        }
        toast({ title: 'Success', description: `User ${isNewUser ? 'created' : 'updated'} successfully.` });
        router.push('/admin/users');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  if (isLoading) {
    return <AdminLayout title={isNewUser ? 'Add New User' : 'Edit User'}><div>Loading...</div></AdminLayout>;
  }

  return (
    <AdminLayout title={isNewUser ? 'Add New User' : 'Edit User'}>
         <div className="flex items-center gap-4 mb-4">
          <Button variant="secondary" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-semibold text-lg md:text-xl">{isNewUser ? 'Create New User Profile' : 'Edit User Profile'}</h1>
        </div>
        <Card>
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">User Details</h2>
                <p className="text-brand-mute">Fill in the details for the user account.</p>
            </div>
          <div className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="id">User ID</Label>
                        <Input id="id" {...register('id')} disabled={!isNewUser} />
                        {errors.id && <p className="text-destructive text-sm mt-1">{errors.id.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input id="name" {...register('name')} />
                         {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="role">Role</Label>
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cashier">Cashier</SelectItem>
                                        <SelectItem value="waiter">Waiter</SelectItem>
                                        <SelectItem value="kitchen">Kitchen</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                     <div>
                        <Label htmlFor="pin">PIN Code (4 digits)</Label>
                        <Input id="pin" type="password" {...register('pin')} placeholder={isNewUser ? 'Required' : 'Leave blank to keep existing'} />
                         {errors.pin && <p className="text-destructive text-sm mt-1">{errors.pin.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex items-center space-x-4">
                        <Label htmlFor="active" className="flex-none">User Active</Label>
                         <Controller
                            name="active"
                            control={control}
                            render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
                         />
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label htmlFor="exposeOnPinLogin" className="flex-none">Show on PIN Login Screen</Label>
                         <Controller
                            name="exposeOnPinLogin"
                            control={control}
                            render={({ field }) => <Switch id="exposeOnPinLogin" checked={field.value} onCheckedChange={field.onChange} />}
                         />
                    </div>
                </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
    </AdminLayout>
  );
}
