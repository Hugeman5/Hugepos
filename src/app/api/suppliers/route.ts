
import { NextResponse } from 'next/server';
import { Suppliers } from '@/lib/repos/suppliersRepo';
import { z } from 'zod';

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatRate: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const suppliers = await Suppliers.all();
  return NextResponse.json(suppliers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'Invalid supplier data', errors: validation.error.errors }, { status: 400 });
  }
  
  const data = validation.data;
  const supplierToSave = {
      ...data,
      id: data.id || `sup_${data.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`.slice(0, 20),
  };

  const saved = await Suppliers.upsert(supplierToSave);
  return NextResponse.json(saved, { status: 201 });
}
