
'use server';

import { 
    type Product, 
    type Modifier, 
    type Tax, 
    type Cart, 
    type CartLine, 
    type CartLineMod,
    type OrderTotal
} from './data';

function getModDelta(mod: CartLineMod, allModifiers: Map<string, Modifier>): number {
    const modifierDef = allModifiers.get(mod.id);
    if (!modifierDef) return 0;

    if (modifierDef.type === 'choice' && mod.optionId) {
        return modifierDef.options?.find(o => o.id === mod.optionId)?.delta || 0;
    }
    if (modifierDef.type === 'count' && mod.count) {
        return (modifierDef.deltaPerUnit || 0) * mod.count;
    }
    return 0;
}


export async function computeLine(
    line: CartLine,
    product: Product,
    allLineModifiers: Modifier[],
    tax: Tax
): Promise<CartLine> {
    const allLineModifiersMap = new Map(allLineModifiers.map(m => [m.id, m]));

    const modsTotal = line.mods.reduce((sum, mod) => sum + getModDelta(mod, allLineModifiersMap), 0);
    const subtotal = (product.price + modsTotal) * line.qty;
    const taxAmt = tax.inclusive ? 0 : subtotal * tax.rate; // Simplified tax
    const total = subtotal + taxAmt;
    
    const modsSummary = line.mods.map(mod => {
        const modDef = allLineModifiersMap.get(mod.id);
        if (!modDef) return '';
        if (modDef.type === 'choice' && mod.optionId) {
            return modDef.options?.find(o => o.id === mod.optionId)?.name;
        }
        if (modDef.type === 'count' && mod.count) {
            return `${mod.count}x ${modDef.name}`;
        }
        return '';
    }).filter(Boolean).join(', ');

    return {
        ...line,
        productName: product.name,
        modsSummary,
        subtotal,
        tax: taxAmt,
        total,
    }
}


export async function computeOrder(
    cart: Cart, 
    productMap: Map<string, Product>,
    modifierMap: Map<string, Modifier>,
    taxMap: Map<string, Tax>
): Promise<OrderTotal> {

    let subtotal = 0;
    let tax = 0;
    let total = 0;

    for (const line of cart.lines) {
        const product = productMap.get(line.productId);
        if (!product) continue;

        const lineTax = taxMap.get(product.taxId);
        if (!lineTax) continue;
        
        const lineModifiers = product.modifierIds?.map(id => modifierMap.get(id)).filter(Boolean) as Modifier[];

        const computed = await computeLine(line, product, lineModifiers, lineTax);
        
        subtotal += computed.subtotal || 0;
        tax += computed.tax || 0;
        total += computed.total || 0;
    }

    return { subtotal, tax, total };
}
