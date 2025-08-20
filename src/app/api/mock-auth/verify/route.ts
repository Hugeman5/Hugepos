
import { NextRequest, NextResponse } from 'next/server';
import { verifyPin } from '@/lib/usersRepo';

export async function POST(req: NextRequest) {
  let body: any = {}; 
  try { 
    body = await req.json(); 
  } catch (e) { 
    return NextResponse.json({ ok: false, error: 'INVALID_JSON_BODY' }, { status: 400 });
  }

  const id = String(body?.identifier ?? '').trim();
  const pin = String(body?.pin ?? '').trim();

  if (!id || !pin) {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400 });
  }

  const user = await verifyPin(id, pin);

  if (!user) {
    return NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS' }, { status: 401 });
  }
  
  return NextResponse.json({ ok: true, user });
}
