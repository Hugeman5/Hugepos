
import { NextResponse } from 'next/server';
import { activeNow } from '@/lib/repos/timeclockRepo';
import { getAllUsers } from '@/lib/usersRepo';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activePunches = await activeNow();
    const users = await getAllUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));

    const result = activePunches.map(p => {
      const user = usersMap.get(p.userId);
      const hourlyRate = user?.hourlyRate ?? 0;
      const accruedZar = (p.elapsedMs / 3600000) * hourlyRate;
      
      return {
        userId: p.userId,
        name: user?.name ?? 'Unknown User',
        role: user?.role ?? 'unknown',
        startedAt: p.startedAt,
        elapsedMs: p.elapsedMs,
        hourlyRate,
        accruedZar,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('[API] /api/payroll/active Error:', e);
    return NextResponse.json({ message: 'Failed to get active payroll data', error: (e as Error).message }, { status: 500 });
  }
}
