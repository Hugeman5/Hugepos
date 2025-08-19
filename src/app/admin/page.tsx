
'use client';
import AdminLayout from '@/components/admin/AdminLayout';
import KpiCard from '@/components/admin/KpiCard';
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { timeSince } from '@/lib/utils';
import { type Settings } from '@/lib/settingsRepo';
import { formatMoney } from '@/lib/money';
import LiveWageWidget from '@/components/payroll/LiveWageWidget';


export default function AdminHome(){
  const [kpi,setKpi]=useState<any>({});
  const [orders,setOrders]=useState<any[]>([]);
  const [low,setLow]=useState<any[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const [sales, lowStock, openTickets, recentOrders, activeUsers, appSettingsRes] = await Promise.all([
        fetch('/api/admin/metrics/sales-today').then(r=>r.json()).catch(()=>({total:0,orders:0,avg:0})),
        fetch('/api/admin/metrics/low-stock').then(r=>r.json()).catch(()=>({count:0,items:[]})),
        fetch('/api/admin/metrics/open-tickets').then(r=>r.json()).catch(()=>({count:0})),
        fetch('/api/admin/orders/recent').then(r=>r.json()).catch(()=>({items:[]})),
        fetch('/api/admin/users/active-count').then(x=>x.json()).catch(()=>({count:0})),
        fetch('/api/settings').catch(()=>null)
      ]);
      setKpi({ sales, low: lowStock, open: openTickets, users: activeUsers });
      setOrders(recentOrders.items || []);
      setLow(lowStock.items || []);
      if (appSettingsRes && appSettingsRes.ok) {
        setSettings(await appSettingsRes.json());
      }
      setLoading(false);
    })();
  },[]);

  const money = (val: number) => {
    if (!settings) return `...`;
    return formatMoney(val || 0, { currency: settings.currency, locale: settings.locale });
  }

  return (
      <AdminLayout title="Dashboard">
        <LiveWageWidget />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-6">
          <KpiCard label="Sales Today" value={money(kpi.sales?.total)} hint={`Orders: ${kpi.sales?.orders ?? 0}`} tone="ok"/>
          <KpiCard label="Avg Ticket" value={money(kpi.sales?.avg)} />
          <KpiCard label="Open Kitchen Tickets" value={kpi.open?.count ?? 0} tone="info"/>
          <KpiCard label="Low-Stock Items" value={kpi.low?.count ?? 0} tone="warn"/>
          <KpiCard label="Active Users" value={kpi.users?.count ?? 0}/>
          <KpiCard label="Status" value="OK" hint="Local-only mode"/>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl2 bg-brand-card border border-brand-line p-4">
            <h2 className="font-semibold mb-3">Recent Orders</h2>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                    ) : orders.length > 0 ? (
                        orders.map((o:any)=>(
                           <TableRow key={o.id}>
                                <TableCell>#{o.number}</TableCell>
                                <TableCell><Badge variant={o.status === 'PAID' ? 'default' : 'secondary'}>{o.status}</Badge></TableCell>
                                <TableCell>{timeSince(o.ts)}</TableCell>
                                <TableCell className="text-right font-mono">{money(o.totals?.total)}</TableCell>
                           </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={4} className="text-center text-brand-mute">No orders yet.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </section>

          <section className="rounded-xl2 bg-brand-card border border-brand-line p-4">
            <h2 className="font-semibold mb-3">Low Stock</h2>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {loading ? (
                        <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                    ) : low.length > 0 ? (
                        low.map((i:any)=>(
                           <TableRow key={i.id}>
                                <TableCell>{i.name}</TableCell>
                                <TableCell className="text-right font-mono">{i.onHand} / {i.reorderPoint} {i.unit||''}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link href="/admin/inventory">Receive</Link>
                                    </Button>
                                </TableCell>
                           </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={3} className="text-center text-brand-mute">All good.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </section>
        </div>
      </AdminLayout>
  );
}

