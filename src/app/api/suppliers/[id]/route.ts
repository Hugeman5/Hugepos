
import { NextResponse } from "next/server";
import { Suppliers } from "@/lib/repos/suppliersRepo";
export const dynamic = "force-dynamic";

export async function DELETE(_: Request, { params }: { params: { id: string } }){
  await Suppliers.remove(params.id);
  return NextResponse.json({ ok:true });
}
