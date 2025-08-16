import { NextResponse } from 'next/server';
import * as templates from '@/lib/printTemplates';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { kind: string } }) {
    try {
        const { kind } = params;
        if (kind !== 'receipt' && kind !== 'kitchen') {
            return NextResponse.json({ message: 'Invalid template kind' }, { status: 400 });
        }
        const html = await templates.getTemplate(kind);
        return NextResponse.json({ html });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to get template', error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { kind: string } }) {
    try {
        const { kind } = params;
        if (kind !== 'receipt' && kind !== 'kitchen') {
            return NextResponse.json({ message: 'Invalid template kind' }, { status: 400 });
        }
        const { html } = await req.json();
        if (typeof html !== 'string') {
             return NextResponse.json({ message: 'HTML content is required' }, { status: 400 });
        }
        await templates.saveTemplate(kind, html);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to save template', error: (error as Error).message }, { status: 500 });
    }
}
