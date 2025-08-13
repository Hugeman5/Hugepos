'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';

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

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { message: 'Invalid credentials or user is inactive.' };
    }

    const user = snapshot.docs[0].data() as any;

    if (
      user.username !== username ||
      user.role?.toLowerCase() !== 'admin' ||
      !user.active
    ) {
      return { message: 'Invalid credentials or user is inactive.' };
    }
  } catch (error: unknown) {
    return { message: 'Login failed. Please try again later.' };
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

  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('pin', '==', pin),
      where('active', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { error: 'Invalid PIN or user is inactive.' };
    }

    const user = snapshot.docs[0].data() as any;

    switch (user.role?.toLowerCase()) {
      case 'cashier':
        redirect('/dashboard-cashier');
      case 'waiter':
        redirect('/dashboard-waiter');
      case 'kitchen':
        redirect('/dashboard-kitchen');
      default:
        return { error: 'User has an invalid role.' };
    }
  } catch (error: unknown) {
    return { error: 'Login failed. If this persists, ensure Firestore indexes are deployed.' };
  }
}
