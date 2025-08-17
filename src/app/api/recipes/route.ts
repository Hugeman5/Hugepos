
import { NextResponse } from 'next/server';
import { getRecipes } from '@/lib/recipesRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const recipes = await getRecipes();
    return NextResponse.json(recipes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch recipes', error: errorMessage }, { status: 500 });
  }
}
