'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

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

  // In a real app, this would query the DB. We use the local file.
  const allUsers = (await import('@/lib/usersRepo')).getAllUsers();
  const adminUser = (await allUsers).find(
    (user) =>
      user.email === email &&
      user.username === username &&
      user.role.toLowerCase() === 'admin' &&
      user.active
  );


  if (!adminUser) {
    return { message: 'Invalid credentials or user is inactive.' };
  }

  // In a real app, you would set a session cookie here.
  // We are skipping this for local-only mock auth.

  redirect('/admin');
}
