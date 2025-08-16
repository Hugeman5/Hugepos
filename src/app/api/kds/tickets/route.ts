
import { NextResponse, type NextRequest } from 'next/server';
import * as ordersRepo from '@/lib/ordersRepo';
import { type KdsTicket, type Order } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('station');

    if (!stationId) {
      return NextResponse.json({ message: 'stationId query parameter is required' }, { status: 400 });
    }

    const recentOrders = await ordersRepo.listRecent();
    
    // Filter for paid orders and map them into KDS tickets
    const tickets: KdsTicket[] = recentOrders
      .filter(o => o.status === 'PAID') // Only paid orders show up on KDS
      .map((order: Order): KdsTicket | null => {
        const stationItems = order.lines
          .filter(line => line.prep.stationId === stationId && line.prep.status !== 'done')
          .map(line => ({
            lineId: line.lineId,
            name: line.name,
            qty: line.qty,
            status: line.prep.status,
            mods: line.mods || [],
          }));

        if (stationItems.length === 0) {
          return null; // Don't create a ticket if no items for this station
        }

        return {
          orderId: order.id,
          number: order.number,
          createdAt: order.ts,
          items: stationItems,
        };
      })
      .filter((ticket): ticket is KdsTicket => ticket !== null) // Remove nulls
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Oldest first

    return NextResponse.json(tickets);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API KDS Tickets] Error for station:`, error);
    return NextResponse.json({ message: 'Failed to fetch KDS tickets', error: errorMessage }, { status: 500 });
  }
}
