
import { NextResponse, type NextRequest } from 'next/server';
import { registerClosures } from '@/lib/reportingRepo';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        
        const items = await registerClosures({ from, to });
        return NextResponse.json({ items });
    } catch(e) {
        console.error(`[API] /api/reports/register-closures Error:`, e);
        return NextResponse.json({ message: "Failed to get report", error: (e as Error).message }, { status: 500 });
    }
}
