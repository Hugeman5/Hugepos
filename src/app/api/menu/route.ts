
import { NextResponse } from 'next/server';
import {
  getProducts,
  getCategories,
  getModifiers,
} from '@/lib/catalogRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts(),
    ]);

    const productsByCategory = products.filter(p=>p.active).reduce((acc, product) => {
        const { categoryId } = product;
        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(product);
        return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      categories: categories.filter(c=>c.active),
      productsByCategory,
    });
  } catch (error) {
    console.error('[/api/menu] ', error);
    return NextResponse.json(
      { message: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}

    