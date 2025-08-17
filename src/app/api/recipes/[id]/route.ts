
import { NextResponse } from "next/server";
import { getRecipesFile, upsertRecipe, deleteRecipe } from "@/lib/repos/recipesRepo";

export const dynamic = "force-dynamic";

export async function PATCH(_req:Request,{params}:{params:{id:string}}){
  try {
    const body = await _req.json();
    const file = await getRecipesFile();
    const current = file.recipes.find(r=>r.id===params.id);
    if (!current) return NextResponse.json({error:"Not found"}, {status:404});
    await upsertRecipe({ ...current, ...body, id: params.id });
    return NextResponse.json({ ok:true });
  } catch(e) {
    return NextResponse.json({error: (e as Error).message}, {status: 500});
  }
}

export async function DELETE(_req:Request,{params}:{params:{id:string}}){
  try {
    await deleteRecipe(params.id);
    return NextResponse.json({ ok:true });
  } catch(e) {
    return NextResponse.json({error: (e as Error).message}, {status: 500});
  }
}
