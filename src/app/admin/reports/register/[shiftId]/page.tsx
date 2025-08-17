
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { type RegisterReport } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function RegisterReportPage() {
  const params = useParams();
  const shiftId = params.shiftId as string;
  const reportId = `report_${shiftId}`;
  
  const [report, setReport] = useState<RegisterReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
  
  if (isLoading) {
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
            <div className="p-4 border-b border-brand-line">
                <h2 className="text-xl font-semibold">Shift Summary</h2>
                <p className="text-brand-mute">Generated on {new Date(report.ts).toLocaleString()}</p>
            </div>
            <div className="p-4 grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Sales Summary</h3>
                    <Separator/>
                    {renderDetailRow('Net Sales', f.format(report.netSales))}
                    {renderDetailRow('Tax', f.format(report.taxTotal))}
                    {renderDetailRow('Total Sales', f.format(report.salesTotal), 'font-bold border-t')}
                    <Separator className="my-4"/>
                    {renderDetailRow('Cash Payments', f.format(report.cashPaymentsTotal))}
                    {renderDetailRow('Card Payments', f.format(report.cardPaymentsTotal))}
                     {renderDetailRow('Total Payments', f.format(report.cashPaymentsTotal + report.cardPaymentsTotal), 'font-bold border-t')}
                </div>
                
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Cash Drawer</h3>
                    <Separator/>
                    {renderDetailRow('Starting Float', f.format(report.startingFloat))}
                    {renderDetailRow('Cash Sales', f.format(report.cashSales))}
                    {renderDetailRow('Pay Ins', f.format(report.cashIn))}
                    {renderDetailRow('Pay Outs', f.format(report.cashOut))}
                    <Separator className="my-4"/>
                    {renderDetailRow('Expected in Drawer', f.format(report.expectedInDrawer), 'font-bold border-t')}
                    {renderDetailRow('Actual in Drawer', f.format(report.actualInDrawer), 'font-bold')}
                    <Separator className="my-4"/>
                    {renderDetailRow('Difference', f.format(report.difference), `font-bold ${report.difference !== 0 ? 'text-destructive' : 'text-green-400'}`)}
                 </div>
                 
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Cash Movements</h3>
                    <Separator/>
                    <div className="text-sm max-h-60 overflow-y-auto">
                        {report.cashMovements.length > 0 ? report.cashMovements.map(m => (
                            <div key={m.id} className={`flex justify-between py-1 ${m.type === 'payout' ? 'text-yellow-400' : 'text-green-400'}`}>
                                <span>{m.reason} ({m.userName})</span>
                                <span>{m.type === 'payout' ? '-' : ''}{f.format(m.amount)}</span>
                            </div>
                        )) : <p className="text-muted-foreground py-2">No cash movements recorded.</p>}
                    </div>
                 </div>
            </div>
        </Card>
    </AdminLayout>
  );
}
