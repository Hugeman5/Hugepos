
import { NextResponse } from 'next/server';
import { getRegister } from '@/lib/registerRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const registerState = await getRegister();
    return NextResponse.json({
      isOpen: !!registerState.current,
      current: registerState.current,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
