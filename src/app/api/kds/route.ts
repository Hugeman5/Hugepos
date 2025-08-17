
import { NextResponse, type NextRequest } from 'next/server';
import { getTickets } from '@/lib/kdsRepo';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('station');
    const status = searchParams.get('status') as 'active' | 'done' | undefined;

    const tickets = await getTickets({ station: stationId || undefined, status });
    return NextResponse.json(tickets);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API KDS] Error fetching tickets:`, error);
    return NextResponse.json({ message: 'Failed to fetch KDS tickets', error: errorMessage }, { status: 500 });
  }
}
