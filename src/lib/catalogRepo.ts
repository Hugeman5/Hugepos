
'use server';
import { promises as fs } from 'fs';
import path from 'path';
import { type Product, type Category, type Modifier, type Tax } from './data';

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', filePath), 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`File not found: ${filePath}, returning default value.`);
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

export async function getTaxes(): Promise<Tax[]> {
  return readJSONFile<Tax[]>('taxes.json', []);
}

export async function getTax(id: string): Promise<Tax | null> {
    const taxes = await getTaxes();
    return taxes.find(t => t.id === id) || null;
}

export async function getCategories(): Promise<Category[]> {
  return readJSONFile<Category[]>('categories.json', []);
}

export async function getProducts(): Promise<Product[]> {
    return readJSONFile<Product[]>('products.json', []);
}

export async function getProduct(id: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find(p => p.id === id) || null;
}

export async function getActiveProductsByCategory(): Promise<Record<string, Product[]>> {
    const products = await getProducts();
    const activeProducts = products.filter(p => p.active);
    
    return activeProducts.reduce((acc, product) => {
        const { categoryId } = product;
        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(product);
        return acc;
    }, {} as Record<string, Product[]>);
}

export async function getModifiers(): Promise<Modifier[]> {
    return readJSONFile<Modifier[]>('modifiers.json', []);
}

export async function getModifiersByIds(ids: string[]): Promise<Modifier[]> {
    const allModifiers = await getModifiers();
    return allModifiers.filter(m => ids.includes(m.id));
}
