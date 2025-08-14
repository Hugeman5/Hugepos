import { NextResponse } from 'next/server';
import { getAllUsers, saveAllUsers, type UserRow } from '@/lib/usersRepo';

export async function GET() {
  const rows = await getAllUsers();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const rows = (await req.json()) as UserRow[];
  await saveAllUsers(rows);
  return NextResponse.json({ ok: true });
}