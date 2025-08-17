
import { promises as fs } from 'fs';
import path from 'path';
import { type PromotionRule, type Order, type AppliedDiscount } from './data';
import { getMenu, type Menu } from './menuRepo';
import { getSettings, type Settings } from './settingsRepo';

const dataDir = path.join(process.cwd(), 'data');
const promotionsPath = path.join(dataDir, 'promotions.json');

type PromoDataFile = {
    rules: PromotionRule[];
    meta: {
        version: number;
        updatedAt: string;
    }
}

const defaultData: PromoDataFile = {
    rules: [],
    meta: { version: 1, updatedAt: new Date().toISOString() }
};

async function readPromotionsFile(): Promise<PromoDataFile> {
  try {
    await fs.access(promotionsPath);
    const data = await fs.readFile(promotionsPath, 'utf-8');
    return JSON.parse(data) as PromoDataFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writePromotionsFile(defaultData);
      return defaultData;
    }
    throw error;
  }
}

async function writePromotionsFile(data: PromoDataFile): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  data.meta.updatedAt = new Date().toISOString();
  await fs.writeFile(promotionsPath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getPromotions(): Promise<PromotionRule[]> {
    const fileData = await readPromotionsFile();
    return fileData.rules;
}

export async function savePromotions(rules: PromotionRule[]): Promise<void> {
    const fileData = await readPromotionsFile();
    fileData.rules = rules;
    await writePromotionsFile(fileData);
}

// --- EVALUATION LOGIC ---

/**
 * Evaluates an order against all active promotions and returns the applicable discounts.
 * @param order The order to evaluate.
 * @returns An object containing the list of applied discounts and the total discount amount.
 */
export async function evaluateOrder(order: Order): Promise<{ discounts: AppliedDiscount[], totalDiscount: number }> {
    const allRules = await getPromotions();
    const menu = await getMenu();
    
    const now = new Date();
    const activeRules = allRules.filter(rule => 
        rule.active && 
        isTimeApplicable(rule, now) &&
        isRoleApplicable(rule, order.user.role as any)
    );
    
    let appliedDiscounts: AppliedDiscount[] = [];
    let totalDiscount = 0;

    for (const rule of activeRules) {
        // TODO: check stacking rules
        const discountAmount = calculateDiscount(order, rule, menu);
        if (discountAmount > 0) {
            appliedDiscounts.push({
                ruleId: rule.id,
                name: rule.name,
                scope: rule.scope,
                amountCents: discountAmount,
                lines: [], // TODO: Populate which lines the discount applies to
            });
            totalDiscount += discountAmount;
        }
    }

    return { discounts: appliedDiscounts, totalDiscount: Math.round(totalDiscount) };
}

function isTimeApplicable(rule: PromotionRule, now: Date): boolean {
    // This is a simplified check. A real implementation should use a library like `date-fns-tz`
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (!rule.time.days.includes(currentDay)) return false;
    if (currentTime < rule.time.start || currentTime > rule.time.end) return false;
    
    return true;
}

function isRoleApplicable(rule: PromotionRule, userRole: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen'): boolean {
    if (!rule.eligibility.roles || rule.eligibility.roles.length === 0) return true;
    return rule.eligibility.roles.includes(userRole);
}

function calculateDiscount(order: Order, rule: PromotionRule, menu: Menu): number {
    if (order.totals.total < rule.eligibility.minSpendCents) return 0;
    
    let discount = 0;
    
    switch (rule.type) {
        case 'percent':
            if (rule.scope === 'order') {
                discount = order.totals.total * (rule.value / 100);
            } else if (rule.scope === 'category') {
                const targetLines = order.lines.filter(line => {
                    const product = menu.items.find(item => item.id === line.productId);
                    return product && rule.targetIds.includes(product.catId);
                });
                const totalOfTargetLines = targetLines.reduce((sum, line) => sum + line.lineTotal, 0);
                discount = totalOfTargetLines * (rule.value / 100);
            }
            // TODO: item scope
            break;
        case 'amount':
             if (rule.scope === 'order') {
                discount = rule.value;
            }
            // TODO: item/category scope for fixed amount
            break;
        case 'bxgy':
            // Simplified BOGO - applies to cheapest item in scope
            const applicableLines = order.lines.filter(line => {
                const product = menu.items.find(item => item.id === line.productId);
                if (!product) return false;
                if (rule.scope === 'item') return rule.targetIds.includes(product.id);
                if (rule.scope === 'category') return rule.targetIds.includes(product.catId);
                return false;
            }).flatMap(line => Array(line.qty).fill(line)); // expand quantities

            if (applicableLines.length >= rule.bxgy.buyQty + rule.bxgy.getQty) {
                const sortedLines = applicableLines.sort((a,b) => a.unitPrice - b.unitPrice);
                discount = sortedLines[0].unitPrice * rule.bxgy.getQty; // Free item is the cheapest
            }
            break;
    }
    
    return discount;
}
