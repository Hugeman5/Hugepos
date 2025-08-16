import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as devicesRepo from '@/lib/devicesRepo';
import { promises as fs } from 'fs';
import path from 'path';
import { type DeviceEvent } from '@/lib/data';

export const dynamic = 'force-dynamic';

const openSchema = z.object({
    deviceId: z.string().optional(),
    registerId: z.string().optional(),
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
        const validation = openSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid request', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { deviceId, registerId } = validation.data;
        if (!deviceId && !registerId) {
            throw new Error("Either deviceId or registerId must be provided.");
        }

        const drawers = await devicesRepo.listDrawers();
        const drawer = deviceId 
            ? drawers.find(d => d.id === deviceId) 
            : drawers.find(d => d.registerId === registerId);
        
        if (!drawer) {
            throw new Error("No matching cash drawer found or configured.");
        }

        if (!drawer.enabled) {
            return NextResponse.json({ success: false, message: "Drawer is disabled." });
        }

        // In a real app, this would send a command to hardware. We just log it.
        await logEvent({
            deviceId: drawer.id,
            type: 'drawer_open',
            payload: { registerId: drawer.registerId }
        });

        return NextResponse.json({ success: true, message: `Open command sent to drawer: ${drawer.name}` });

    } catch (error) {
        return NextResponse.json({ message: 'Failed to open drawer', error: (error as Error).message }, { status: 500 });
    }
}
