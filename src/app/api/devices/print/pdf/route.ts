
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as pdf from '@/lib/pdf';
import { buildReceiptHTML } from '@/lib/receipt';

export const dynamic = 'force-dynamic';

const pdfSchema = z.object({
  orderId: z.string(),
  type: z.enum(['receipt', 'invoice']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = pdfSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid request', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { orderId, type } = validation.data;
    
    const [order, payments] = await Promise.all([
      ordersRepo.getOrder(orderId),
      paymentsRepo.listByOrder(orderId)
    ]);

    if (!order) {
        return NextResponse.json({ message: `Order ${orderId} not found.` }, { status: 404 });
    }

    const html = buildReceiptHTML(order, payments);
    const fileName = `${type}_${order.number}`;
    const path = await pdf.renderAndSave(html, fileName);

    return NextResponse.json({ success: true, path });

  } catch (error) {
    console.error('[API PDF] Error:', error);
    return NextResponse.json({ message: 'Failed to generate PDF', error: (error as Error).message }, { status: 500 });
  }
}
