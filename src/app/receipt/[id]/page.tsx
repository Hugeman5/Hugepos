
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!params.id) return;
    const fetchReceipt = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/orders/${params.id}/receipt`);
        if (!res.ok) {
          throw new Error('Failed to fetch receipt data.');
        }
        const data = await res.json();
        setReceiptHtml(data.html);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReceipt();
  }, [params.id, toast]);
  
  const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow && receiptHtml) {
          printWindow.document.write(receiptHtml);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
      } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not open print dialog.'})
      }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted">
      <Card className="w-full max-w-lg">
        <div className="flex flex-row items-center justify-between p-4 border-b border-brand-line">
          <h2 className="text-xl font-semibold">Receipt</h2>
          <Button onClick={handlePrint} disabled={!receiptHtml || isLoading}>
            <Printer className="mr-2" /> Print
          </Button>
        </div>
        <div className="p-4">
          {isLoading && <p>Loading receipt...</p>}
          {receiptHtml && (
            <div className="border rounded-md overflow-hidden">
              <iframe
                srcDoc={receiptHtml}
                className="w-full h-[60vh]"
                title={`Receipt for order ${params.id}`}
              />
            </div>
          )}
          {!isLoading && !receiptHtml && <p>Could not load receipt.</p>}
        </div>
      </Card>
    </main>
  );
}
