
import { NextResponse } from 'next/server';
import * as settingsRepo from '@/lib/settingsRepo';
import * as taxHelper from '@/lib/tax';
import * as taxCatalog from '@/lib/taxCatalog';
import { z } from 'zod';

export const dynamic = "force-dynamic";

const sanityCheckSchema = z.object({
  lines: z.array(z.object({
    unitPrice: z.number(),
    qty: z.number(),
    taxCategoryId: z.string().optional(),
  })),
  priceIncludesVAT: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = sanityCheckSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid data", errors: validation.error.errors }, { status: 400 });
    }
    
    const settings = await settingsRepo.getSettings();
    const priceIncludesVAT = validation.data.priceIncludesVAT ?? settings.vat.priceIncludesVAT;

    const computedLines = validation.data.lines.map(line => {
      const rate = taxCatalog.getRateForCategory(line.taxCategoryId, settings);
      const totals = taxHelper.lineTotals({ ...line, rate, priceIncludesVAT });
      return { ...line, rate, ...totals };
    });

    const totalGross = computedLines.reduce((sum, l) => sum + l.gross, 0);
    const totalNet = computedLines.reduce((sum, l) => sum + l.net, 0);
    const totalTax = computedLines.reduce((sum, l) => sum + l.tax, 0);

    return NextResponse.json({
      lines: computedLines,
      totals: {
        net: totalNet,
        tax: totalTax,
        gross: totalGross
      }
    });

  } catch (error) {
    return NextResponse.json({ message: "Tax sanity check failed", error: (error as Error).message }, { status: 500 });
  }
}
