

import { NextResponse } from 'next/server';
import { getAllIngredients } from '@/lib/repos/ingredientsRepo';

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
