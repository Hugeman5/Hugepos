import { NextResponse, type NextRequest } from 'next/server';
import { salesOverview } from '@/lib/reportingRepo';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        
        const overview = await salesOverview({ from, to });
        return NextResponse.json(overview);
    } catch(e) {
        console.error(`[API] /api/reports/overview Error:`, e);
        return NextResponse.json({ message: "Failed to get report", error: (e as Error).message }, { status: 500 });
    }
}
