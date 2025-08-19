
'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { timeFromMs } from '@/lib/utils';
import { User } from '@/lib/data';

type Row = { id: string; userId: string; type: 'in' | 'out' | 'breakStart' | 'breakEnd'; ts: string, userName?: string };
type Summary = Record<string, { totalMs: number; days: Record<string, number>, userName?: string }>;


export default function TimeclockReport() {
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 7 * 24 * 3600e3).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [userId, setUserId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [sum, setSum] = useState<Summary>({});
  const [users, setUsers] = useState<User[]>([]);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (userId) q.set('user', userId);
    if (from) q.set('from', new Date(from + 'T00:00:00Z').toISOString());
    if (to) q.set('to', new Date(new Date(to + 'T00:00:00Z').getTime() + 24 * 3600e3).toISOString());
    const [r1, r2, usersRes] = await Promise.all([
      fetch(`/api/timeclock/punches?${q.toString()}`, { cache: 'no-store' }),
      fetch(`/api/timeclock/summary?${q.toString()}`, { cache: 'no-store' }),
      fetch('/api/admin/users'),
    ]);
    const punchData = await r1.json();
    const summaryData = await r2.json();
    const userData: User[] = await usersRes.json();
    setUsers(userData);
    const userMap = new Map(userData.map(u => [u.id, u.name]));
    
    setRows(punchData.map((r: Row) => ({ ...r, userName: userMap.get(r.userId) || r.userId })));
    
    const enrichedSummary: Summary = {};
    for (const id in summaryData) {
        enrichedSummary[id] = {
            ...summaryData[id],
            userName: userMap.get(id) || id
        }
    }
    setSum(enrichedSummary);

  }, [from, to, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
      <AdminLayout title="Time & Attendance">
        <div className="space-y-4">
          <Card>
            <CardHeader>
                <CardTitle>Filter Report</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 items-end">
                    <div>
                        <label className="block text-xs opacity-70">From</label>
                        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs opacity-70">To</label>
                        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs opacity-70">User ID (optional)</label>
                        <Input placeholder="e.g. jcashier" value={userId} onChange={e => setUserId(e.target.value)} />
                    </div>
                    <Button onClick={load}>Refresh</Button>
                </div>
            </CardContent>
          </Card>
          
           <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Total Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {Object.keys(sum).length === 0 && <TableRow><TableCell colSpan={2} className="text-center">No summary data.</TableCell></TableRow>}
                            {Object.entries(sum).map(([uid, data]) => (
                                <TableRow key={uid}>
                                    <TableCell>{data.userName}</TableCell>
                                    <TableCell className="text-right font-mono">{timeFromMs(data.totalMs)}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Individual Punches</CardTitle></CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map(r => (
                                <tr key={r.id}>
                                    <TableCell>{r.userName}</TableCell>
                                    <TableCell className="capitalize">{r.type}</TableCell>
                                    <TableCell className="font-mono">{format(new Date(r.ts), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                                </tr>
                                ))}
                                {rows.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No punches found.</TableCell></TableRow>}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
           </div>
        </div>
      </AdminLayout>
  );
}
