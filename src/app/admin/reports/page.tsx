
'use client';
import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/DateRangePicker';
import { addDays, format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import KpiCard from '@/components/admin/KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const n = new Intl.NumberFormat('en-US');

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function useReportData<T>(endpoint: string, params: URLSearchParams): { data: T | null; isLoading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/reports/${endpoint}?${params.toString()}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error(`Failed to fetch ${endpoint}`, error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [endpoint, params.toString()]);

  return { data, isLoading };
}


export default function ReportsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -14),
        to: new Date(),
    });

    const params = useMemo(() => {
        const p = new URLSearchParams();
        if (date?.from) p.set('from', format(date.from, 'yyyy-MM-dd'));
        if (date?.to) p.set('to', format(date.to, 'yyyy-MM-dd'));
        return p;
    }, [date]);

    const { data: overview, isLoading: loadingOverview } = useReportData<any>('overview', params);
    const { data: salesByDay, isLoading: loadingByDay } = useReportData<any>('by-day', params);
    const { data: byCategory, isLoading: loadingByCategory } = useReportData<any>('by-category', params);
    const { data: byItem, isLoading: loadingByItem } = useReportData<any>('by-item', params);
    const { data: paymentMix, isLoading: loadingPaymentMix } = useReportData<any>('payment-mix', params);
    const { data: registerClosures, isLoading: loadingClosures } = useReportData<any>('register-closures', params);

  return (
    <AdminLayout title="Reports & Analytics">
        <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="flex items-center gap-2">
                <DateRangePicker date={date} setDate={setDate} />
            </div>
        </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
           <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="registers">Registers</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
            <Card>
                <div className="p-4 border-b border-brand-line">
                    <h2 className="text-xl font-semibold">Sales Overview</h2>
                    <p className="text-brand-mute">A summary of sales performance for the selected period.</p>
                </div>
                <div className="p-4">
                    {loadingOverview ? <p>Loading...</p> : overview ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <KpiCard label="Net Sales" value={f.format(overview.net)} />
                            <KpiCard label="Gross Sales" value={f.format(overview.gross)} />
                            <KpiCard label="Discounts" value={f.format(overview.discounts)} />
                            <KpiCard label="Tax" value={f.format(overview.tax)} />
                             <KpiCard label="Orders" value={n.format(overview.orders)} />
                            <KpiCard label="Avg. Ticket Size" value={f.format(overview.avgTicket)} />
                            <KpiCard label="Items Sold" value={n.format(overview.items)} />
                            <KpiCard label="Items per Order" value={overview.itemsPerOrder.toFixed(2)} />
                        </div>
                    ) : <p>No overview data available.</p>}
                </div>
            </Card>
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
            <Card>
                <div className="p-4 border-b border-brand-line"><h2 className="text-xl font-semibold">Sales by Day</h2></div>
                <div className="p-4 h-96">
                    {loadingByDay ? <p>Loading chart...</p> : salesByDay?.items?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesByDay.items}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip formatter={(value, name) => name === 'net' ? f.format(value as number) : value } />
                                <Legend />
                                <Bar yAxisId="left" dataKey="net" fill="#8884d8" name="Net Sales" />
                                <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p>No sales data to display.</p>}
                </div>
            </Card>
        </TabsContent>
         <TabsContent value="items" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
                 <Card>
                    <div className="p-4 border-b border-brand-line"><h2 className="text-xl font-semibold">Sales by Category</h2></div>
                    <div className="p-4">
                        {loadingByCategory ? <p>Loading...</p> : byCategory?.items?.length > 0 ? (
                           <Table>
                               <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Net Sales</TableHead></TableRow></TableHeader>
                               <TableBody>
                                   {byCategory.items.map((cat:any) => (
                                       <TableRow key={cat.categoryId}>
                                           <TableCell>{cat.categoryName}</TableCell>
                                           <TableCell className="text-right">{n.format(cat.qty)}</TableCell>
                                           <TableCell className="text-right">{f.format(cat.net)}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        ) : <p>No data.</p>}
                    </div>
                </Card>
                <Card>
                    <div className="p-4 border-b border-brand-line"><h2 className="text-xl font-semibold">Top Selling Items</h2></div>
                    <div className="p-4">
                        {loadingByItem ? <p>Loading...</p> : byItem?.items?.length > 0 ? (
                           <Table>
                               <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Net Sales</TableHead></TableRow></TableHeader>
                               <TableBody>
                                   {byItem.items.map((item:any) => (
                                       <TableRow key={item.productId}>
                                           <TableCell>{item.name}</TableCell>
                                           <TableCell className="text-right">{n.format(item.qty)}</TableCell>
                                           <TableCell className="text-right">{f.format(item.net)}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        ) : <p>No data.</p>}
                    </div>
                </Card>
            </div>
         </TabsContent>
         <TabsContent value="payments" className="mt-4">
            <Card>
                <div className="p-4 border-b border-brand-line"><h2 className="text-xl font-semibold">Payment Mix</h2></div>
                <div className="p-4 h-96">
                     {loadingPaymentMix ? <p>Loading...</p> : paymentMix?.items?.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={paymentMix.items} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={(entry: any) => `${entry.type} (${entry.sharePct.toFixed(1)}%)`}>
                             {paymentMix.items.map((entry:any, index:number) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip formatter={(value) => f.format(value as number)} />
                           <Legend />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : <p>No payment data.</p>}
                </div>
            </Card>
         </TabsContent>
         <TabsContent value="registers" className="mt-4">
            <Card>
                <div className="p-4 border-b border-brand-line"><h2 className="text-xl font-semibold">Register Closures</h2></div>
                <div className="p-4">
                     {loadingClosures ? <p>Loading...</p> : registerClosures?.items?.length > 0 ? (
                           <Table>
                               <TableHeader><TableRow><TableHead>Shift</TableHead><TableHead>Register</TableHead><TableHead className="text-right">Expected</TableHead><TableHead className="text-right">Counted</TableHead><TableHead className="text-right">Discrepancy</TableHead></TableRow></TableHeader>
                               <TableBody>
                                   {registerClosures.items.map((s:any) => (
                                       <TableRow key={s.shiftId}>
                                           <TableCell>{s.shiftId}</TableCell>
                                           <TableCell>{s.registerId}</TableCell>
                                           <TableCell className="text-right">{f.format(s.expectedCash)}</TableCell>
                                           <TableCell className="text-right">{f.format(s.countedCash)}</TableCell>
                                           <TableCell className={`text-right ${s.discrepancy !== 0 ? 'text-destructive' : ''}`}>{f.format(s.discrepancy)}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        ) : <p>No register closure data.</p>}
                </div>
            </Card>
         </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
