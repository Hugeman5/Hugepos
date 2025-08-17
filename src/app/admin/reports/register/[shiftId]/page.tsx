
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type RegisterReport } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { type Settings } from '@/lib/settingsRepo';

export default function RegisterReportPage() {
  const params = useParams();
  const shiftId = params.shiftId as string;
  const reportId = `report_${shiftId}`;
  
  const [report, setReport] = useState<RegisterReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            const data = await res.json();
            setSettings(data);
        } catch(e) {
             console.error(e);
        }
    }
    fetchSettings();
  }, []);

  const money = (value: number) => {
    if (!settings) return `...`;
    return formatMoney(value, { currency: settings.currency, locale: settings.locale });
  };

  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/register/report/${reportId}`);
        if (res.status === 404) {
          toast({ variant: 'destructive', title: 'Not Found', description: `Report ${reportId} does not exist.` });
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch report');
        const data = await res.json();
        setReport(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [reportId, toast]);
  
  if (isLoading || !settings) {
    return <AdminLayout title="Register Report"><div>Loading report...</div></AdminLayout>;
  }

  if (!report) {
    return <AdminLayout title="Register Report"><div>Report not found.</div></AdminLayout>;
  }
  
  const renderDetailRow = (label: string, value: any, className = '') => (
    <div className={`flex justify-between py-2 ${className}`}>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <AdminLayout title={`Register Report: ${shiftId}`}>
        <div className="flex items-center gap-4 mb-4">
            <Button variant="secondary" size="icon" asChild>
                <Link href="/admin/registers">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="font-semibold text-lg md:text-xl">Z Report for Shift <span className="font-mono">{shiftId}</span></h1>
            <Button variant="secondary" className="ml-auto" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
        </div>
        <Card className="bg-brand-card border-brand-line">
            <CardHeader>
                <CardTitle>Shift Summary</CardTitle>
                <p className="text-brand-mute">Generated on {new Date(report.ts).toLocaleString()}</p>
            </CardHeader>
            <CardContent className="p-4 grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Sales Summary</h3>
                    <Separator/>
                    {renderDetailRow('Net Sales', money(report.netSales))}
                    {renderDetailRow('Tax', money(report.taxTotal))}
                    {renderDetailRow('Total Sales', money(report.salesTotal), 'font-bold border-t')}
                    <Separator className="my-4"/>
                    {renderDetailRow('Cash Payments', money(report.cashPaymentsTotal))}
                    {renderDetailRow('Card Payments', money(report.cardPaymentsTotal))}
                     {renderDetailRow('Total Payments', money(report.cashPaymentsTotal + report.cardPaymentsTotal), 'font-bold border-t')}
                </div>
                
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Cash Drawer</h3>
                    <Separator/>
                    {renderDetailRow('Starting Float', money(report.startingFloat))}
                    {renderDetailRow('Cash Sales', money(report.cashSales))}
                    {renderDetailRow('Pay Ins', money(report.cashIn))}
                    {renderDetailRow('Pay Outs', money(report.cashOut))}
                    <Separator className="my-4"/>
                    {renderDetailRow('Expected in Drawer', money(report.expectedInDrawer), 'font-bold border-t')}
                    {renderDetailRow('Actual in Drawer', money(report.actualInDrawer), 'font-bold')}
                    <Separator className="my-4"/>
                    {renderDetailRow('Difference', money(report.difference), `font-bold ${report.difference !== 0 ? 'text-destructive' : 'text-green-400'}`)}
                 </div>
                 
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Cash Movements</h3>
                    <Separator/>
                    <div className="text-sm max-h-60 overflow-y-auto">
                        {report.cashMovements.length > 0 ? report.cashMovements.map(m => (
                            <div key={m.id} className={`flex justify-between py-1 ${m.type === 'payout' ? 'text-yellow-400' : 'text-green-400'}`}>
                                <span>{m.reason} ({m.userName})</span>
                                <span>{m.type === 'payout' ? '-' : ''}{money(m.amount)}</span>
                            </div>
                        )) : <p className="text-muted-foreground py-2">No cash movements recorded.</p>}
                    </div>
                 </div>
            </CardContent>
        </Card>
    </AdminLayout>
  );
}
