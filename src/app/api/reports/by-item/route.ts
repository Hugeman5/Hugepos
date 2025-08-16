
import { NextResponse, type NextRequest } from 'next/server';
import { salesByItem } from '@/lib/reportingRepo';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const top = searchParams.get('top') ? parseInt(searchParams.get('top')!) : 50;
        
        const items = await salesByItem({ from, to, top });
        return NextResponse.json({ items });
    } catch(e) {
        console.error(`[API] /api/reports/by-item Error:`, e);
        return NextResponse.json({ message: "Failed to get report", error: (e as Error).message }, { status: 500 });
    }
}
