import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as printRepo from '@/lib/printRepo';
import * as devicesRepo from '@/lib/devicesRepo';
import * as ordersRepo from '@/lib/ordersRepo';
import * as paymentsRepo from '@/lib/paymentsRepo';
import * as templates from '@/lib/printTemplates';
import * as settingsRepo from '@/lib/settingsRepo';
import * as signing from '@/lib/signing';
import * as qr from '@/lib/qr';
import * as barcode from '@/lib/barcode';
import { promises as fs } from 'fs';
import path from 'path';
import { formatMoney } from '@/lib/money';

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
             const settings = await settingsRepo.getSettings();
             const html = await templates.render("receipt", { outlet:"Test Outlet", register: "Test Register", orderNumber: "TEST-001", ts: new Date().toLocaleString(), server: "Test User", lines: [{qty:1, name:"Test Item", priceEach: formatMoney(10, settings.currency, settings.locale)}], subtotal:formatMoney(10, settings.currency, settings.locale), discount: formatMoney(0, settings.currency, settings.locale), vat:formatMoney(1.5, settings.currency, settings.locale), total:formatMoney(11.5, settings.currency, settings.locale), priceIncludesVAT:true, vatRatePct: 15, qrUrl:"", code128Url:"" });
             const outputPath = `/data/prints/${job.id}.html`;
             await fs.writeFile(path.join(process.cwd(), 'data', 'prints', `${job.id}.html`), html);
             job = await printRepo.setStatus(job.id, { outputPath, status: 'rendered' });
             return NextResponse.json(job);
        }

        if (type === 'receipt') {
            if (!orderId) throw new Error("orderId is required for receipt prints.");
            const order = await ordersRepo.getOrder(orderId);
            const payments = await paymentsRepo.listByOrder(orderId);
            if (!order) throw new Error(`Order ${orderId} not found.`);

            const printer = deviceId ? await devicesRepo.getPrinter(deviceId) : (await devicesRepo.listPrinters()).find(p => p.kind === 'receipt');
            if (!printer) throw new Error("No receipt printer found or specified.");
            
            const settings = await settingsRepo.getSettings();

            // --- Generate signed QR and barcode ---
            const ts = new Date(order.ts).toISOString();
            const totalCents = Math.round((order.totals.total || 0) * 100);
            const sig = await signing.signReceipt({ orderId: order.id, totalCents, ts });
            const deepPath = `/r/${encodeURIComponent(order.id)}?ts=${encodeURIComponent(ts)}&total=${totalCents}&sig=${sig}`;
            const qrUrl = await qr.qrDataUrl(`http://localhost:9000${deepPath}`, 150); // Using localhost for now
            const code128Url = await barcode.code128SvgDataUrl(String(order.number));
            // ------------------------------------

            const templateData = {
                outlet: "Main Outlet",
                register: "Front Register",
                orderNumber: order.number,
                ts: new Date(order.ts).toLocaleString(),
                server: order.user.name,
                lines: order.lines.map(line => ({
                    name: line.name,
                    qty: line.qty,
                    priceEach: formatMoney(line.lineTotal, settings.currency, settings.locale)
                })),
                subtotal: formatMoney(order.totals.subtotal, settings.currency, settings.locale),
                discount: formatMoney(order.totals.discount || 0, settings.currency, settings.locale),
                vat: formatMoney(order.totals.tax, settings.currency, settings.locale),
                total: formatMoney(order.totals.total, settings.currency, settings.locale),
                priceIncludesVAT: settings.vat.priceIncludesVAT,
                vatRatePct: Math.round(settings.vat.defaultRate * 100),
                payments,
                qrUrl,
                code128Url
            };

            job = await printRepo.enqueue({ deviceId: printer.id, type, payload: templateData });
            
            const html = await templates.render('receipt', templateData);
            const outputPath = `/data/prints/${job.id}.html`;
            await fs.writeFile(path.join(process.cwd(), 'data', 'prints', `${job.id}.html`), html);

            job = await printRepo.setStatus(job.id, { outputPath, status: 'rendered' });
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
                    const payload = {
                        order, 
                        items: linesByStation[stationId].map(item => ({
                            seat: order.service?.seatMap?.find(s=>s.lineId === item.lineId)?.seatNo || '',
                            qty: item.qty,
                            name: item.name,
                            mods: (item.mods || []).map((m:any) => m.name).join(', ')
                        })),
                        station: stationId,
                        table: order.service?.tableId || "N/A",
                        checkId: order.service?.checkId || "N/A",
                        server: order.user.name,
                        ts: new Date(order.ts).toLocaleTimeString(),
                        notes: order.notes,
                     };
                    let job = await printRepo.enqueue({ deviceId: printer.id, type, payload });
                    
                    const html = await templates.render('kitchen', payload);
                    const outputPath = `/data/prints/${job.id}.html`;
                    await fs.writeFile(path.join(process.cwd(), 'data', 'prints', `${job.id}.html`), html);

                    const finalJob = await printRepo.setStatus(job.id, { outputPath, status: 'rendered' });
                    jobs.push(finalJob);
                }
            }
            return NextResponse.json({ jobs });
        }
        
        return NextResponse.json({ job });
    } catch (error) {
        console.error("Print API Error:", error);
        return NextResponse.json({ message: 'Failed to create print job', error: (error as Error).message }, { status: 500 });
    }
}
