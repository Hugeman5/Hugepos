
import { NextResponse } from 'next/server';
import { exportItemsCsv } from '@/lib/menuImportRepo';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const csv = await exportItemsCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="items-export.csv"',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to export items", error: errorMessage }, { status: 500 });
  }
}
