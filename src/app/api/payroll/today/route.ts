
import { NextResponse } from 'next/server';
import { startOfToday, endOfToday, subDays } from 'date-fns';
import { earningsForRange, activeNow } from '@/lib/repos/timeclockRepo';
import { getAllUsers } from '@/lib/usersRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getAllUsers();
    const usersMap = new Map(users.map(u => [u.id, u]));
    
    const from = startOfToday().toISOString();
    const to = endOfToday().toISOString();
    
    const [todayEarnings, onDuty] = await Promise.all([
        earningsForRange({ from, to }),
        activeNow()
    ]);
    
    const usersSummary = Array.from(usersMap.values()).map(user => {
      const earnings = todayEarnings[user.id];
      const dutyInfo = onDuty.find(p => p.userId === user.id);
      
      const workedMs = earnings ? earnings.totalMs : 0;
      const earningsZar = earnings ? earnings.earningsZar : 0;
      
      return {
        userId: user.id,
        name: user.name,
        role: user.role,
        hourlyRate: user.hourlyRate ?? 0,
        workedMs,
        earningsZar,
        onDuty: !!dutyInfo
      };
    });

    const onDutyCount = onDuty.length;
    const liveBurnPerHour = onDuty.reduce((sum, p) => {
        const user = usersMap.get(p.userId);
        return sum + (user?.hourlyRate ?? 0);
    }, 0);

    const accruedSoFar = Object.values(todayEarnings).reduce((sum, u) => sum + u.earningsZar, 0);

    return NextResponse.json({
        from,
        to,
        onDutyCount,
        liveBurnPerHour,
        accruedSoFar,
        users: usersSummary.filter(u => u.workedMs > 0 || u.onDuty)
    });

  } catch (e) {
    console.error('[API] /api/payroll/today Error:', e);
    return NextResponse.json({ message: 'Failed to get payroll summary', error: (e as Error).message }, { status: 500 });
  }
}
