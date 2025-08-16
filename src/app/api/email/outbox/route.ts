
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const outboxPath = path.join(process.cwd(), 'data', 'email_outbox.json');

export async function GET(req: Request) {
    try {
        const items = JSON.parse(await fs.readFile(outboxPath, 'utf-8').catch(() => '[]'));
        return NextResponse.json({ items });
    } catch (error) {
        console.error('[API Outbox] Error:', error);
        return NextResponse.json({ message: 'Failed to read email outbox', error: (error as Error).message }, { status: 500 });
    }
}
