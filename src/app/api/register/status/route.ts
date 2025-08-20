import { NextResponse } from 'next/server';
import { getRegisterStatus } from '@/lib/repos/registerRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getRegisterStatus();
    return NextResponse.json(status);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
