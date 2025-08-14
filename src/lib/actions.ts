'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { users as localUsers } from '@/lib/data';

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
  await new Promise((resolve) => setTimeout(resolve, 300));

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

  const matched = localUsers.find((u) =>
    (u.email?.toLowerCase() === email.toLowerCase()) &&
    (u.username?.toLowerCase() === username.toLowerCase()) &&
    (u.role.toLowerCase() === 'admin') &&
    u.active === true
  );

  if (!matched) {
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
  await new Promise((resolve) => setTimeout(resolve, 300));
  const pin = (formData.get('pin') as string) || '';

  if (pin.length !== 4) {
    return { error: 'Invalid PIN. Must be 4 digits.' };
  }

  const matched = localUsers.find((u) => u.pin === pin && u.active === true);

  if (!matched) {
    return { error: 'Invalid PIN or user is inactive.' };
  }

  switch (matched.role.toLowerCase()) {
    case 'cashier':
      redirect('/dashboard-cashier');
    case 'waiter':
      redirect('/dashboard-waiter');
    case 'kitchen':
      redirect('/dashboard-kitchen');
    case 'admin':
      redirect('/dashboard-admin');
    default:
      return { error: 'User has an invalid role.' };
  }
}
