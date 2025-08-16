import { NextResponse } from 'next/server';
import { getConfig, updateConfig } from '@/lib/devicesRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await getConfig();
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ message: 'Failed to get device config', error: (error as Error).message }, { status: 500 });
    }
}

const printerSchema = z.object({ id: z.string(), name: z.string(), kind: z.enum(['receipt', 'kitchen']), driver: z.enum(['html', 'escpos']), enabled: z.boolean(), widthChars: z.number().optional(), stations: z.array(z.string()).optional() });
const drawerSchema = z.object({ id: z.string(), name: z.string(), registerId: z.string(), driver: z.enum(['mock', 'serial']), enabled: z.boolean() });
const scannerSchema = z.object({ id: z.string(), name: z.string(), mode: z.enum(['keyboard', 'serial']), enabled: z.boolean() });

const configSchema = z.object({
    printers: z.array(printerSchema).optional(),
    drawers: z.array(drawerSchema).optional(),
    scanners: z.array(scannerSchema).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = configSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid config data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const updatedConfig = await updateConfig(validation.data);
        return NextResponse.json(updatedConfig);
    } catch (error) {
         return NextResponse.json({ message: 'Failed to save device config', error: (error as Error).message }, { status: 500 });
    }
}
