
import { 
    type Product, 
    type Modifier, 
    type Tax, 
    type Cart, 
    type CartLine, 
    type CartLineMod,
    type OrderTotal
} from './data';
import * as settingsRepo from './settingsRepo';
import * as taxCatalog from './taxCatalog';
import * as taxHelper from './tax';


export async function getModDelta(mod: CartLineMod, allModifiers: Map<string, Modifier>): Promise<number> {
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
    allLineModifiers: Modifier[]
): Promise<CartLine> {
    const allLineModifiersMap = new Map(allLineModifiers.map(m => [m.id, m]));
    const settings = await settingsRepo.getSettings();

    const modsDeltas = await Promise.all(line.mods.map(mod => getModDelta(mod, allLineModifiersMap)));
    const modsTotal = modsDeltas.reduce((sum, delta) => sum + delta, 0);
    
    const unitPriceWithMods = product.price + modsTotal;

    const rate = taxCatalog.getRateForCategory(product.taxId, settings);
    const totals = taxHelper.lineTotals({
      unitPrice: unitPriceWithMods,
      qty: line.qty,
      rate,
      priceIncludesVAT: settings.vat.priceIncludesVAT
    });

    const modsSummary = line.mods.map(mod => {
        const modDef = allLineModifiersMap.get(mod.id);
        if (!modDef) return '';
        if (modDef.type === 'choice' && mod.optionId) {
            const opt = modDef.options?.find(o => o.id === mod.optionId);
            if (opt && opt.delta !== 0) {
                 return `${opt.name} (${opt.delta > 0 ? '+' : ''}${settings.currencySymbol}${opt.delta.toFixed(2)})`;
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
        subtotal: totals.net,
        tax: totals.tax,
        total: totals.gross,
    }
}


export async function computeOrder(
    cart: Cart, 
    productMap: Map<string, Product>,
    modifierMap: Map<string, Modifier>
): Promise<OrderTotal & { lines: CartLine[] }> {

    let subtotal = 0;
    let tax = 0;
    let total = 0;
    
    const computedLines = await Promise.all(cart.lines.map(async (line) => {
        const product = productMap.get(line.productId);
        if (!product) throw new Error("Product not found");
        
        const lineModifiers = product.modifierIds?.map(id => modifierMap.get(id)).filter(Boolean) as Modifier[];

        const computed = await computeLine(line, product, lineModifiers);
        
        subtotal += computed.subtotal;
        tax += computed.tax;
        total += computed.total;

        return computed;
    }));

    return { subtotal, tax, total, lines: computedLines };
}
