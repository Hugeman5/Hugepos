
'use client';

import { useEffect, useState } from "react";
import KpiCard from "../admin/KpiCard";
import { formatMoney } from "@/lib/money";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "../ui/table";
import { timeFromMs } from "@/lib/utils";

type ActiveUser = {
  userId: string;
  name: string;
  role: string;
  startedAt: string;
  elapsedMs: number;
  hourlyRate: number;
  accruedZar: number;
}

type TodaySummary = {
  onDutyCount: number;
  liveBurnPerHour: number;
  accruedSoFar: number;
}

export default function LiveWageWidget() {
  const [active, setActive] = useState<ActiveUser[]>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [activeRes, todayRes] = await Promise.all([
          fetch('/api/payroll/active'),
          fetch('/api/payroll/today'),
        ]);
        if (activeRes.ok) setActive(await activeRes.json());
        if (todayRes.ok) setToday(await todayRes.json());
      } catch (e) {
        console.error("Failed to fetch payroll data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
        <div className="grid sm:grid-cols-3 gap-4">
            <KpiCard label="On Duty" value={today?.onDutyCount ?? 0} />
            <KpiCard label="Live Burn / hr" value={formatMoney(today?.liveBurnPerHour ?? 0)} />
            <KpiCard label="Accrued Today" value={formatMoney(today?.accruedSoFar ?? 0)} tone="warn" />
        </div>
        <div>
            <h3 className="font-semibold mb-2 text-sm">Clocked-In Staff</h3>
            <div className="rounded-xl2 bg-brand-card border border-brand-line p-2 max-h-40 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Elapsed</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead className="text-right">Accrued</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
                        {!loading && active.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-brand-mute">Nobody is clocked in.</TableCell></TableRow>}
                        {active.map(user => (
                            <TableRow key={user.userId}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{timeFromMs(user.elapsedMs)}</TableCell>
                                <TableCell>{formatMoney(user.hourlyRate)}/h</TableCell>
                                <TableCell className="text-right">{formatMoney(user.accruedZar)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  )
}
