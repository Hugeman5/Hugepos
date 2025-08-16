import { NextResponse } from "next/server";
import { receiveStock } from "@/lib/inventoryRepo";
import { z } from "zod";

export const dynamic = "force-dynamic";

const receiveStockSchema = z.object({
  ingredientId: z.string(),
  quantity: z.number().positive(),
  note: z.string().optional(),
  user: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = receiveStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const updatedItem = await receiveStock(validation.data);

    return NextResponse.json(updatedItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to receive stock:", errorMessage);
    return NextResponse.json({ message: "Failed to receive stock", error: errorMessage }, { status: 500 });
  }
}
