import { NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { type DeviceEvent } from '@/lib/data';

export const dynamic = 'force-dynamic';

const scanSchema = z.object({
    code: z.string().min(1),
    source: z.string().optional(),
});

async function logEvent(event: Omit<DeviceEvent, 'id'|'ts'>) {
    const eventsPath = path.join(process.cwd(), 'data', 'device_events.json');
    const events = JSON.parse(await fs.readFile(eventsPath, 'utf-8').catch(() => '[]'));
    const newEvent: DeviceEvent = { ...event, id: `evt_${Date.now()}`, ts: new Date().toISOString() };
    events.unshift(newEvent);
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = scanSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid scan request', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { code, source } = validation.data;
        
        await logEvent({
            deviceId: source || 'simulated_scanner',
            type: 'scan',
            payload: { code }
        });

        return NextResponse.json({ success: true, message: `Scan of '${code}' logged.` });

    } catch (error) {
        return NextResponse.json({ message: 'Failed to simulate scan', error: (error as Error).message }, { status: 500 });
    }
}
