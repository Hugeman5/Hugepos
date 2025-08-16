import { NextResponse } from 'next/server';
import { orders } from '@/lib/data';
import { type NextRequest } from 'next/server'

export const dynamic = "force-dynamic";

// In a real app, you'd fetch from a database.
// For now, we're using mock data.
export async function GET(request: NextRequest) {
  try {
    // The kitchen dashboard is expecting all orders and will filter client-side for now.
    // A more robust API would support filtering by status, e.g., ?status=pending
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to get orders:", error);
    return NextResponse.json({ message: "Failed to get orders" }, { status: 500 });
  }
}
