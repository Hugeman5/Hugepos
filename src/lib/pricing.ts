
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

export function getModDelta(mod: CartLineMod, allModifiers: Map<string, Modifier>): number {
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
            const opt = modDef.options?.find(o => o.id === mod.optionId);
            if (opt && opt.delta !== 0) {
                 return `${opt.name} (${opt.delta > 0 ? '+' : ''}$${opt.delta.toFixed(2)})`;
            }
            return opt?.name;
        }
        if (modDef.type === 'count' && mod.count) {
            const delta = (modDef.deltaPerUnit || 0);
             if (delta !== 0) {
                 return `${mod.count}x ${modDef.name} (+${(delta * mod.count).toFixed(2)})`;
            }
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
): Promise<OrderTotal & { lines: CartLine[] }> {

    let subtotal = 0;
    let tax = 0;
    let total = 0;
    
    const computedLines = await Promise.all(cart.lines.map(async (line) => {
        const product = productMap.get(line.productId);
        if (!product) throw new Error("Product not found");

        const lineTax = taxMap.get(product.taxId);
        if (!lineTax) throw new Error("Tax not found");
        
        const lineModifiers = product.modifierIds?.map(id => modifierMap.get(id)).filter(Boolean) as Modifier[];

        const computed = await computeLine(line, product, lineModifiers, lineTax);
        
        subtotal += computed.subtotal;
        tax += computed.tax;
        total += computed.total;

        return computed;
    }));

    return { subtotal, tax, total, lines: computedLines };
}
