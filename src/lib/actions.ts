'use server';

import { z } from 'zod';
import { getAllUsers } from './usersRepo';

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
  success: boolean;
  redirectUrl?: string;
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
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid credentials. Please check your input.',
    };
  }

  const { email, username } = validatedFields.data;

  // In a real app, this would query the DB. We use the local file.
  const allUsers = await getAllUsers();
  const adminUser = allUsers.find(
    (user) =>
      user.email === email &&
      user.username === username &&
      user.role.toLowerCase() === 'admin' &&
      user.active
  );

  if (!adminUser) {
    return { success: false, message: 'Invalid credentials or user is inactive.' };
  }
  
  return { success: true, redirectUrl: '/admin' };
}
