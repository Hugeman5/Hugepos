
import { NextResponse } from 'next/server';
import { getAllUsers, upsertUser, getUserById } from '@/lib/usersRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch users", error: errorMessage }, { status: 500 });
  }
}

const userSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager', 'cashier']),
  active: z.boolean(),
  exposeOnPinLogin: z.boolean(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits').optional().or(z.literal('')),
  outlets: z.array(z.string()).optional(),
  email: z.string().email().optional().or(z.literal('')),
  username: z.string().optional(),
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid user data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const existingUser = await getUserById(validation.data.id);
    if (existingUser) {
        // When updating, if PIN is not provided, keep the old one.
        if (!validation.data.pin && existingUser.pin) {
            validation.data.pin = existingUser.pin;
        }
    } else {
        if (!validation.data.pin) {
             return NextResponse.json({ message: "A 4-digit PIN is required for new users." }, { status: 400 });
        }
    }

    const savedUser = await upsertUser(validation.data);
    return NextResponse.json(savedUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to save user", error: errorMessage }, { status: 500 });
  }
}
