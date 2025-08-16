
import { NextResponse } from 'next/server';
import { importItemsCsv } from '@/lib/menuImportRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const importSchema = z.object({
  csv: z.string().min(1, 'CSV data is required.'),
  dryRun: z.boolean().optional().default(false)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = importSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { csv, dryRun } = validation.data;
    
    // For now, dryRun is not implemented in the repo, we just proceed.
    // A full implementation would have the repo function support a dryRun flag.
    const result = await importItemsCsv(csv);
    
    if (result.errors.length > 0) {
        return NextResponse.json({ message: "Import failed with validation errors.", errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({ success: true, upserted: result.upserted });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to import items", error: errorMessage }, { status: 500 });
  }
}
