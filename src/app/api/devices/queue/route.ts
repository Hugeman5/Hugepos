import { NextResponse } from 'next/server';
import { listQueue } from '@/lib/printRepo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as any;
        const items = await listQueue({ status });
        return NextResponse.json({ items });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to list print queue', error: (error as Error).message }, { status: 500 });
    }
}
