import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as printRepo from '@/lib/printRepo';
import * as devicesRepo from '@/lib/devicesRepo';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as templates from '@/lib/printTemplates';

export const dynamic = 'force-dynamic';

const printSchema = z.object({
    type: z.enum(['receipt', 'kitchen', 'test']),
    deviceId: z.string().optional(),
    orderId: z.string().optional(),
    station: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        await printRepo.ensureSpoolDir();
        const body = await req.json();
        const validation = printSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid print request', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { type, deviceId, orderId, station } = validation.data;
        let job;

        if (type === 'test') {
             if (!deviceId) throw new Error("deviceId is required for test prints.");
             job = await printRepo.enqueue({ deviceId, type, payload: { message: "Test print successful!" } });
             const template = await templates.getTemplate('test');
             const html = templates.render(template, { ...job.payload, ts: new Date().toLocaleString() });
             const outputPath = `/data/prints/${job.id}.html`;
             await fs.writeFile(path.join(process.cwd(), outputPath), html);
             job = await printRepo.setStatus(job.id, 'rendered', { outputPath });
             return NextResponse.json(job);
        }

        if (type === 'receipt') {
            if (!orderId) throw new Error("orderId is required for receipt prints.");
            const order = await ordersRepo.getOrder(orderId);
            const payments = await paymentsRepo.listByOrder(orderId);
            if (!order) throw new Error(`Order ${orderId} not found.`);

            const printer = deviceId ? await devicesRepo.getPrinter(deviceId) : (await devicesRepo.listPrinters()).find(p => p.kind === 'receipt');
            if (!printer) throw new Error("No receipt printer found or specified.");

            const payload = { order, payments, ts: new Date().toLocaleString() };
            job = await printRepo.enqueue({ deviceId: printer.id, type, payload });

            const template = await templates.getTemplate('receipt');
            const html = templates.render(template, payload);
            const outputPath = `/data/prints/${job.id}.html`;
            await require('fs').promises.writeFile(path.join(process.cwd(), 'data', 'prints', `${job.id}.html`), html);

            job = await printRepo.setStatus(job.id, 'rendered', { outputPath });
        }

        if (type === 'kitchen') {
            if (!orderId) throw new Error("orderId is required for kitchen prints.");
            const order = await ordersRepo.getOrder(orderId);
            if (!order) throw new Error(`Order ${orderId} not found.`);

            // Group lines by station
            const linesByStation: Record<string, any[]> = {};
            for (const line of order.lines) {
                const stationId = line.prep.stationId;
                if (!linesByStation[stationId]) linesByStation[stationId] = [];
                linesByStation[stationId].push(line);
            }

            const printers = await devicesRepo.listPrinters();
            const kitchenPrinters = printers.filter(p => p.kind === 'kitchen');
            
            const jobs = [];
            for (const stationId in linesByStation) {
                const printer = kitchenPrinters.find(p => p.stations?.includes(stationId));
                if (printer) {
                    const payload = { order, items: linesByStation[stationId], station: stationId };
                    const job = await printRepo.enqueue({ deviceId: printer.id, type, payload });
                    const template = await templates.getTemplate('kitchen');
                    const html = templates.render(template, payload);
                    const outputPath = `/data/prints/${job.id}.html`;
                     await require('fs').promises.writeFile(path.join(process.cwd(), 'data', 'prints', `${job.id}.html`), html);

                    const finalJob = await printRepo.setStatus(job.id, 'rendered', { outputPath });
                    jobs.push(finalJob);
                }
            }
            return NextResponse.json({ jobs });
        }
        
        return NextResponse.json({ job });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to create print job', error: (error as Error).message }, { status: 500 });
    }
}
