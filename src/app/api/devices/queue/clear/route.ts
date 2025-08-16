import { NextResponse } from 'next/server';
import { clearQueue } from '@/lib/printRepo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        await clearQueue(body.all === true);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to clear print queue', error: (error as Error).message }, { status: 500 });
    }
}
