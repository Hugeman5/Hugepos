
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as pdf from '@/lib/pdf';
import { buildReceiptHTML } from '@/lib/receipt';
import { promises as fs } from 'fs';
import path from 'path';
import { type EmailOutboxItem } from '@/lib/data';

export const dynamic = 'force-dynamic';

const emailSchema = z.object({
  orderId: z.string(),
  to: z.string().email(),
});

const outboxPath = path.join(process.cwd(), 'data', 'email_outbox.json');

async function addToOutbox(item: Omit<EmailOutboxItem, 'id' | 'ts'>) {
    const outbox = JSON.parse(await fs.readFile(outboxPath, 'utf-8').catch(() => '[]'));
    const newItem: EmailOutboxItem = {
        ...item,
        id: `email_${Date.now()}`,
        ts: new Date().toISOString(),
    };
    outbox.unshift(newItem);
    await fs.writeFile(outboxPath, JSON.stringify(outbox, null, 2));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = emailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid request', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { orderId, to } = validation.data;

    const [order, payments] = await Promise.all([
      ordersRepo.getOrder(orderId),
      paymentsRepo.listByOrder(orderId)
    ]);
    if (!order) {
        return NextResponse.json({ message: `Order ${orderId} not found.` }, { status: 404 });
    }

    const html = buildReceiptHTML(order, payments);
    const fileName = `receipt_${order.number}`;
    const htmlPath = await pdf.renderAndSave(html, fileName);
    
    await addToOutbox({
        to,
        subject: `Your receipt for order #${order.number}`,
        htmlPath,
        status: 'queued',
    });

    return NextResponse.json({ success: true, message: `Receipt for order ${order.number} queued for ${to}.` });

  } catch (error) {
    console.error('[API Email] Error:', error);
    return NextResponse.json({ message: 'Failed to queue email', error: (error as Error).message }, { status: 500 });
  }
}
