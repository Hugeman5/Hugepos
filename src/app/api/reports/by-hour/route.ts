
import { NextResponse, type NextRequest } from 'next/server';
import { salesByHour } from '@/lib/reportingRepo';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        
        const items = await salesByHour({ from, to });
        return NextResponse.json({ items });
    } catch(e) {
        console.error(`[API] /api/reports/by-hour Error:`, e);
        return NextResponse.json({ message: "Failed to get report", error: (e as Error).message }, { status: 500 });
    }
}
