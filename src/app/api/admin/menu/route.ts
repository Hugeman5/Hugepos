
import { NextResponse } from 'next/server';
import { getMenu } from '@/lib/menuRepo';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const menu = await getMenu();
        // Sort items and categories for consistent client display
        menu.categories.sort((a, b) => a.sort - b.sort);
        menu.items.sort((a, b) => a.sort - b.sort);
        return NextResponse.json(menu);
    } catch(e) {
        console.error(e);
        return NextResponse.json({ message: "Failed to load menu", error: (e as Error).message }, { status: 500 });
    }
}

    
