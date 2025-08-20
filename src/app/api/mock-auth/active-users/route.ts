import { NextResponse } from 'next/server';
import { listActiveForPinLogin } from '@/lib/repos/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await listActiveForPinLogin();
    return NextResponse.json(users, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('Failed to list active users for PIN login', e);
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}
