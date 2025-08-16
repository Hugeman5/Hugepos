'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { orders } from '@/lib/data';
import { applyUsageFromOrder } from '@/lib/inventoryRepo';
import type { User } from '@/lib/data';


// Mock data moved here to avoid client/server module conflicts
const users: User[] = [
  { id: 1, name: 'Admin User', role: 'Admin', email: 'admin@hugepos.com', username: 'admin', active: true },
  { id: 2, name: 'John Cashier', role: 'Cashier', pin: '1234', active: true },
  { id: 3, name: 'Jane Waiter', role: 'Waiter', pin: '5678', active: true },
  { id: 4, name: 'Chef Mike', role: 'Kitchen', pin: '9876', active: true },
  { id: 5, name: 'Inactive User', role: 'Cashier', pin: '0000', active: false },
];


const adminLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
});

export type AdminLoginState = {
  errors?: {
    email?: string[];
    username?: string[];
  };
  message?: string | null;
};

export async function loginAdmin(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const validatedFields = adminLoginSchema.safeParse({
    email: formData.get('email'),
    username: formData.get('username'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid credentials. Please check your input.',
    };
  }

  const { email, username } = validatedFields.data;

  const adminUser = users.find(
    (user) =>
      user.email === email &&
      user.username === username &&
      user.role.toLowerCase() === 'admin' &&
      user.active
  );


  if (!adminUser) {
    return { message: 'Invalid credentials or user is inactive.' };
  }

  redirect('/dashboard-admin');
}

// ---------------------------
// STAFF LOGIN
// ---------------------------

export type StaffLoginState = {
  error?: string | null;
};

export async function loginStaff(
  prevState: StaffLoginState,
  formData: FormData
): Promise<StaffLoginState> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const pin = formData.get('pin') as string;

  if (!pin || pin.length !== 4) {
    return { error: 'Invalid PIN. Must be 4 digits.' };
  }
  
  const staffUser = users.find(
    (user) =>
      user.pin === pin &&
      user.active
  );

  if (!staffUser) {
    return { error: 'Invalid PIN or user is inactive.' };
  }

  switch (staffUser.role.toLowerCase()) {
    case 'cashier':
      redirect('/dashboard-cashier');
    case 'waiter':
      redirect('/dashboard-waiter');
    case 'kitchen':
      redirect('/dashboard-kitchen');
    default:
      return { error: 'User has an invalid role.' };
  }
}

export async function payOrder(orderId: string) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        throw new Error("Order not found");
    }
    order.status = 'paid';
    const inventoryMovesCount = await applyUsageFromOrder(order);
    return {
        ...order,
        inventoryMovesCount
    }
}
