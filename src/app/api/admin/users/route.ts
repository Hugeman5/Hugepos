
import { NextResponse } from 'next/server';
import { getAllUsers, upsertUser } from '@/lib/usersRepo';
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
  id: z.string().optional(), // ID is optional for creation
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager', 'cashier', 'waiter', 'kitchen']),
  active: z.boolean().default(true),
  exposeOnPinLogin: z.boolean().default(true),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits').optional().or(z.literal('')),
  outlets: z.array(z.string()).optional(),
  email: z.string().email().optional().or(z.literal('')),
  username: z.string().optional(),
  hourlyRate: z.number().optional().default(0),
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid user data", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    let userData = validation.data;
    const users = await getAllUsers();
    
    // If it's an update
    if (userData.id) {
        const existingUser = users.find(u => u.id === userData.id);
        if (existingUser) {
            // If PIN is not provided in update, keep the old one.
            if (!userData.pin) {
                userData.pin = existingUser.pin;
            }
        } else {
             return NextResponse.json({ message: `User with ID ${userData.id} not found.` }, { status: 404 });
        }
    } else { // If it's a new user
        if (!userData.pin) {
             return NextResponse.json({ message: "A 4-digit PIN is required for new users." }, { status: 400 });
        }
        userData.id = userData.username || userData.name.toLowerCase().replace(/\s+/g, '');
        if (users.some(u => u.id === userData.id)) {
            userData.id = `${userData.id}_${Math.random().toString(36).slice(2, 6)}`;
        }
    }

    const savedUser = await upsertUser(userData as any);
    return NextResponse.json(savedUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to save user", error: errorMessage }, { status: 500 });
  }
}
