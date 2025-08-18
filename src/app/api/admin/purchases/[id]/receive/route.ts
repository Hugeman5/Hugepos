
import { NextResponse } from 'next/server';
import { POs } from '@/lib/repos/purchaseOrdersRepo';
import { getAllIngredients, saveAllIngredients } from '@/lib/repos/ingredientsRepo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const po = await POs.byId(id);

  if (!po) {
    return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
  }

  if (po.status !== 'sent') {
    return NextResponse.json({ message: 'Can only receive POs that have been sent.' }, { status: 400 });
  }
  
  // This is a simplified receive process. In a real app, you would:
  // 1. Allow user to input actual received quantities vs ordered quantities.
  // 2. Create a Goods Received Note (GRN).
  // 3. Update inventory stock levels based on GRN.
  
  // For now, we just update the ingredient's last price.
  const allIngredients = await getAllIngredients();
  const ingredientsMap = new Map(allIngredients.map(i => [i.id, i]));
  let ingredientsUpdated = false;

  for (const line of po.lines) {
      // Find the corresponding catalog item to find the linked ingredient
      const { sku } = line; // Assuming SKU links them. A more robust system would use a direct ingredientId link.
      const ingredientToUpdate = allIngredients.find(ing => ing.sku === sku && ing.supplierId === po.supplierId);

      if (ingredientToUpdate) {
        ingredientToUpdate.priceIncVat = line.unitPriceIncVat;
        ingredientToUpdate.priceExVat = line.unitPriceExVat;
        ingredientToUpdate.vatRate = line.vatRate;
        ingredientToUpdate.lastSupplierId = po.supplierId;
        if (!ingredientToUpdate.priceHistory) {
            ingredientToUpdate.priceHistory = [];
        }
        ingredientToUpdate.priceHistory.unshift({
            at: new Date().toISOString(),
            supplierId: po.supplierId,
            priceIncVat: line.unitPriceIncVat,
        });
        // Keep only the last 5 price points for history
        ingredientToUpdate.priceHistory = ingredientToUpdate.priceHistory.slice(0, 5);
        
        ingredientsMap.set(ingredientToUpdate.id, ingredientToUpdate);
        ingredientsUpdated = true;
      }
  }
  
  if (ingredientsUpdated) {
    await saveAllIngredients(Array.from(ingredientsMap.values()));
  }

  po.status = 'received';
  po.receivedAt = new Date().toISOString();
  await POs.update(po);

  return NextResponse.json({ success: true, updatedPO: po });
}
