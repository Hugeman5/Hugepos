
"use client";
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/DateRangePicker";
import { type DateRange } from "react-day-picker";
import { addDays, format } from 'date-fns';
import { Button } from "@/components/ui/Button";

type Row = { userId:string; name:string; shifts:number; minutes:number; hours:number; hourlyRate:number; wage:number };
type Data = { rows: Row[] };

export default function TimeReportPage() {
  const [data, setData] = useState<Data>({ rows: [] });
  const [err, setErr] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
      from: addDays(new Date(), -7),
      to: new Date(),
  });

  const loadReport = useCallback(async () => {
    setErr("");
    try {
      const params = new URLSearchParams();
      if (date?.from) params.set('from', date.from.toISOString());
      if (date?.to) params.set('to', date.to.toISOString());

      const r = await fetch(`/api/shifts/summary?${params.toString()}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Failed to load summary");
      setData(d);
    } catch (e:any) {
      setErr(e?.message || "Error loading report");
    }
  }, [date]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const total = data.rows.reduce((s, r) => s + r.wage, 0);

  return (
    <AdminLayout title="Staff Time & Wages">
      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Filter Report</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
                 <div className="grid gap-2">
                    <Label>Date range</Label>
                    <DateRangePicker date={date} setDate={setDate} />
                 </div>
                 <Button onClick={loadReport}>Refresh</Button>
            </CardContent>
        </Card>

        {err && <div className="text-red-500 text-sm mb-3">{err}</div>}
        
        <Card>
            <CardHeader>
                <CardTitle>Wages Summary</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Shifts</TableHead>
                            <TableHead className="text-right">Minutes</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Wage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rows.map(r => (
                            <TableRow key={r.userId}>
                                <TableCell className="font-medium">{r.name}</TableCell>
                                <TableCell className="text-right">{r.shifts}</TableCell>
                                <TableCell className="text-right">{r.minutes}</TableCell>
                                <TableCell className="text-right">{r.hours.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{formatMoney(r.hourlyRate, { currency: "ZAR" })}</TableCell>
                                <TableCell className="text-right font-medium">{formatMoney(r.wage, { currency: "ZAR" })}</TableCell>
                            </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={5}>Total</TableCell>
                            <TableCell className="text-right">{formatMoney(total, { currency: "ZAR" })}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
