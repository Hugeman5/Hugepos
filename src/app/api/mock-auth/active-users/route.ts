
import { NextResponse } from 'next/server';
import { listActiveForPinLogin } from '@/lib/usersRepo';
export async function GET() { 
    const users = await listActiveForPinLogin(); 
    return NextResponse.json(users); 
}
