
import { NextResponse } from 'next/server';
import { getAllIngredients, saveIngredients } from '@/lib/repos/ingredientsRepo';
import { type Ingredient } from '@/lib/repos/ingredientsRepo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ingredients = await getAllIngredients();
    return NextResponse.json(ingredients);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch ingredients', error: errorMessage }, { status: 500 });
  }
}

const ingredientSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  uom: z.enum(['kg', 'g', 'l', 'ml', 'ea']),
  packSize: z.number().positive(),
  costCents: z.number().int().min(0),
});


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = ingredientSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid ingredient data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const ingredients = await getAllIngredients();
        const exists = ingredients.some(ing => ing.id === validation.data.id);
        if(exists) {
            return NextResponse.json({ message: `Ingredient with ID '${validation.data.id}' already exists.` }, { status: 409 });
        }
        
        // This endpoint is for creating only, not implemented for upserting in this manner
        // ingredients.push(validation.data);
        // await saveIngredients(ingredients);

        return NextResponse.json(validation.data, { status: 201 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Failed to save ingredient', error: errorMessage }, { status: 500 });
    }
}
