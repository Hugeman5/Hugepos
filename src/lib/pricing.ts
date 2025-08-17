

import { 
    type Cart, 
    type CartLine, 
    type CartLineMod,
    type OrderTotal,
    type OrderLineMod
} from './data';
import * as settingsRepo from './settingsRepo';
import * as taxCatalog from './taxCatalog';
import * as taxHelper from './tax';
import { getMenu, type Menu, type MenuItem, type ModifierSet } from './menuRepo';


export async function getModDelta(mod: CartLineMod, modifierSet: ModifierSet): Promise<number> {
    let delta = 0;
    for (const optionId of mod.optionIds) {
        const option = modifierSet.options.find(o => o.id === optionId);
        if (option) {
            delta += option.priceDeltaCents;
        }
    }
    return delta;
}


export async function computeLine(
    line: CartLine,
    product: MenuItem,
    menu: Menu
): Promise<CartLine & { mods: OrderLineMod[]}> {
    
    const settings = await settingsRepo.getSettings();

    let modsTotalDelta = 0;
    const resolvedMods: OrderLineMod[] = [];

    for (const modSelection of line.mods) {
        const set = menu.modifierSets.find(ms => ms.id === modSelection.setId);
        if (!set) continue;

        for (const optionId of modSelection.optionIds) {
            const option = set.options.find(o => o.id === optionId);
            if (option) {
                modsTotalDelta += option.priceDeltaCents;
                resolvedMods.push({
                    setId: set.id,
                    setName: set.name,
                    optionId: option.id,
                    optionName: option.name,
                    deltaCents: option.priceDeltaCents,
                });
            }
        }
    }

    const unitPriceWithMods = product.priceCents + modsTotalDelta;

    const rate = taxCatalog.getRateForCategory(product.taxCode, settings);
    const totals = taxHelper.lineTotals({
      unitPrice: unitPriceWithMods / 100, // tax helper expects dollars/rands
      qty: line.qty,
      rate,
      priceIncludesVAT: settings.vat.priceIncludesVAT
    });

    const modsSummary = resolvedMods.map(m => m.optionName).join(', ');

    return {
        ...line,
        mods: resolvedMods, // The fully resolved modifiers
        productName: product.name,
        modsSummary,
        subtotal: totals.net,
        tax: totals.tax,
        total: totals.gross,
    }
}


export async function computeOrder(
    cart: Cart, 
    menu: Menu
): Promise<OrderTotal & { lines: (CartLine & { mods: OrderLineMod[] })[] }> {

    let subtotal = 0;
    let tax = 0;
    let total = 0;
    
    const computedLines = await Promise.all(cart.lines.map(async (line) => {
        const product = menu.items.find(p => p.id === line.productId);
        if (!product) throw new Error("Product not found");
        
        const computed = await computeLine(line, product, menu);
        
        subtotal += computed.subtotal;
        tax += computed.tax;
        total += computed.total;

        return computed;
    }));

    return { subtotal, tax, total, lines: computedLines };
}
