
import { NextResponse } from 'next/server';
import { getAllRoles, saveRoles } from '@/lib/rolesRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const roles = await getAllRoles();
    return NextResponse.json(roles);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch roles", error: errorMessage }, { status: 500 });
  }
}

// Basic schema, can be expanded for full validation
const roleSchema = z.object({
  editable: z.boolean(),
  permissions: z.record(z.any())
});

const rolesMatrixSchema = z.object({
  admin: roleSchema,
  manager: roleSchema,
  cashier: roleSchema,
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = rolesMatrixSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid roles data", errors: validation.error.errors }, { status: 400 });
    }

    // You cannot edit the admin role via the API
    if (JSON.stringify(validation.data.admin) !== JSON.stringify((await getAllRoles()).admin)) {
        return NextResponse.json({ message: "Admin role is not editable." }, { status: 403 });
    }

    await saveRoles(validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to save roles", error: errorMessage }, { status: 500 });
  }
}
