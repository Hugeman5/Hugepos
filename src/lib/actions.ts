'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { applyUsageFromOrder } from '@/lib/inventoryRepo';
import type { User, Order } from '@/lib/data';


// Mock data moved here to avoid client/server module conflicts
const users: User[] = [
  { id: 'admin', name: 'Admin User', role: 'admin', email: 'admin@hugepos.com', username: 'admin', active: true },
  { id: 'jcashier', name: 'John Cashier', role: 'cashier', pin: '1234', active: true },
  { id: 'jwaiter', name: 'Jane Waiter', role: 'manager', pin: '5678', active: true },
  { id: 'chef', name: 'Chef Mike', role: 'cashier', pin: '9876', active: true },
  { id: 'inactive', name: 'Inactive User', role: 'cashier', pin: '0000', active: false },
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

  redirect('/admin');
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
  const userId = formData.get('userId') as string;

  if (!pin || pin.length !== 4) {
    return { error: 'Invalid PIN. Must be 4 digits.' };
  }
  
  if (!userId) {
      return { error: 'Please select a user.' };
  }
  
  const staffUser = users.find(
    (user) =>
      user.pin === pin &&
      user.id.toString() === userId &&
      user.active
  );

  if (!staffUser) {
    return { error: 'Invalid PIN or user is inactive.' };
  }

  switch (staffUser.role.toLowerCase()) {
    case 'cashier':
      redirect('/dashboard-cashier');
    case 'manager':
       redirect('/dashboard-waiter');
    // case 'waiter':
    //   redirect('/dashboard-waiter');
    case 'kitchen':
      redirect('/kds');
    default:
      return { error: 'User has an invalid role for PIN login.' };
  }
}
