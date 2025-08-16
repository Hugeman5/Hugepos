
import { NextResponse } from 'next/server';
import { getStations, saveStations } from '@/lib/stationsRepo';
import { z } from 'zod';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stations = await getStations();
    return NextResponse.json(stations);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch stations", error: errorMessage }, { status: 500 });
  }
}

const stationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
const saveStationsSchema = z.array(stationSchema);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = saveStationsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    await saveStations(validation.data);
    return NextResponse.json({ success: true, count: validation.data.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to save stations", error: errorMessage }, { status: 500 });
  }
}
