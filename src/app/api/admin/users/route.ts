import { NextResponse } from 'next/server';
import { getAllUsers, saveAllUsers, type UserRow } from '@/lib/usersRepo';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getAllUsers();
    return NextResponse.json(rows, { status: 200 });
  } catch (e) {
    console.error('[admin/users GET]', e);
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rows = (await req.json()) as unknown;
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: 'Array of users required' }, { status: 400 });
    }
    await saveAllUsers(rows as UserRow[]);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('[admin/users POST]', e);
    return NextResponse.json({ error: 'Failed to save users' }, { status: 500 });
  }
}