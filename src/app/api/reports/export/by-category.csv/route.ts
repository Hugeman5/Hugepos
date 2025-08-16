import { NextResponse, type NextRequest } from 'next/server';
import { salesByCategory } from '@/lib/reportingRepo';
import { stringify } from 'csv-stringify/sync';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        
        const items = await salesByCategory({ from, to });
        const csv = stringify(items, { header: true });
        
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="report-by-category.csv"`,
            },
        });
    } catch(e) {
        console.error(`[API] /api/reports/export/by-category.csv Error:`, e);
        return NextResponse.json({ message: "Failed to export report", error: (e as Error).message }, { status: 500 });
    }
}
