
import { NextResponse } from 'next/server';
import { getCustomer, deleteCustomer } from '@/lib/customersRepo';

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const customer = await getCustomer(id);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to get customer", error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await deleteCustomer(id);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: "Failed to delete customer", error: errorMessage }, { status: 500 });
    }
}
