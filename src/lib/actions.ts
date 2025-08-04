'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { users } from './data';

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

export async function loginAdmin(prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
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

  const user = users.find(
    (u) => u.role === 'Admin' && u.email === email && u.username === username && u.active
  );

  if (!user) {
    return { message: 'Invalid credentials or user is inactive.' };
  }

  redirect('/dashboard-admin');
}

export type StaffLoginState = {
  error?: string | null;
};


export async function loginStaff(prevState: StaffLoginState, formData: FormData): Promise<StaffLoginState> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const pin = formData.get('pin') as string;

  if(!pin || pin.length !== 4){
      return {error: "Invalid PIN. Must be 4 digits."}
  }

  const user = users.find((u) => u.pin === pin && u.active);

  if (!user) {
    return { error: 'Invalid PIN or user is inactive.' };
  }

  switch (user.role) {
    case 'Cashier':
      redirect('/dashboard-cashier');
    case 'Waiter':
      redirect('/dashboard-waiter');
    case 'Kitchen':
      redirect('/dashboard-kitchen');
    default:
      return { error: 'User has an invalid role.' };
  }
}
