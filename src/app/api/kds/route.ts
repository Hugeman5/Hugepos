
import { NextResponse, type NextRequest } from 'next/server';
import { readAll } from '@/lib/orders/orderRepo';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('station') || 'kitchen';

    const allOrders = await readAll();
    
    const sentOrders = allOrders.filter(o => o.status === 'sent');
    
    const tickets = sentOrders
        .map(o => {
            const linesForStation = o.lines
                .filter(l => l.station === stationId && l.state !== 'bumped')
                .map(l => ({
                    lineId: l.id,
                    name: l.name,
                    qty: l.qty,
                    state: l.state
                }));

            if (linesForStation.length === 0) {
                return null;
            }

            return {
                orderId: o.id,
                ticketNo: o.ticketNo,
                tableId: o.tableId,
                createdAt: o.createdAt,
                lines: linesForStation
            };
        })
        .filter(Boolean); // remove nulls

    return NextResponse.json({ tickets });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API KDS] Error fetching tickets:`, error);
    return NextResponse.json({ message: 'Failed to fetch KDS tickets', error: errorMessage }, { status: 500 });
  }
}
