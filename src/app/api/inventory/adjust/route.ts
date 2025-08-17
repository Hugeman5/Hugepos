
import { NextResponse } from "next/server";
import { adjustStock } from "@/lib/inventoryRepo";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adjustStockSchema = z.object({
  ingredientId: z.string(),
  delta: z.number(), // can be negative
  note: z.string().optional(),
  user: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = adjustStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }
    
    if (validation.data.delta === 0) {
        return NextResponse.json({ message: "Delta cannot be zero." }, { status: 400 });
    }

    const updatedItem = await adjustStock(validation.data);

    return NextResponse.json(updatedItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to adjust stock:", errorMessage);
    return NextResponse.json({ message: "Failed to adjust stock", error: errorMessage }, { status: 500 });
  }
}
