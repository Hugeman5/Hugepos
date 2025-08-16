
import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settingsRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: "Failed to get settings", error: (error as Error).message }, { status: 500 });
  }
}

const vatSchema = z.object({
    priceIncludesVAT: z.boolean().optional(),
    defaultRate: z.number().min(0).max(1).optional(),
});

const settingsPatchSchema = z.object({
    vat: vatSchema.optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = settingsPatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid settings data", errors: validation.error.errors }, { status: 400 });
    }
    const newSettings = await saveSettings(validation.data);
    return NextResponse.json(newSettings);
  } catch (error) {
    return NextResponse.json({ message: "Failed to save settings", error: (error as Error).message }, { status: 500 });
  }
}
