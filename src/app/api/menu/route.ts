
import { NextResponse } from 'next/server';
import {
  getTaxes,
  getCategories,
  getActiveProductsByCategory,
  getModifiers,
} from '@/lib/catalogRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [taxes, categories, productsByCategory, modifiers] = await Promise.all([
      getTaxes(),
      getCategories(),
      getActiveProductsByCategory(),
      getModifiers(),
    ]);

    return NextResponse.json({
      taxes,
      categories,
      productsByCategory,
      modifiers,
    });
  } catch (error) {
    console.error('[/api/menu] ', error);
    return NextResponse.json(
      { message: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}
