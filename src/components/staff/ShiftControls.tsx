
'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { type Shift } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';
import { formatMoney } from '@/lib/money';

type ShiftStatus = {
  isOpen: boolean;
  current: Shift | null;
};

export default function ShiftControls({ registerId }: { registerId?: string }) {
  const [status, setStatus] = useState<ShiftStatus>({ isOpen: false, current: null });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const refreshStatus = useCallback(async () => {
    if (!registerId) return;
    try {
      const res = await fetch(`/api/register/status?registerId=${registerId}`);
      if (res.ok) {
        setStatus(await res.json());
      } else {
        setStatus({ isOpen: false, current: null });
      }
    } catch (e) {
      console.error('Failed to fetch shift status', e);
      setStatus({ isOpen: false, current: null });
    }
  }, [registerId]);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 15000);
    return () => clearInterval(interval);
  }, [refreshStatus]);
  
  const user = getSession();

  const handleOpenRegister = () => {
    if (!registerId) return;
    const float = prompt("Enter opening float amount:", "500.00");
    if (float !== null) {
        setBusy(true);
        fetch('/api/register/open', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ registerId, floatAmount: parseFloat(float), user }),
        }).then(res => {
            if (!res.ok) throw new Error("Failed to open register");
            return res.json();
        }).then(() => refreshStatus()).finally(() => setBusy(false));
    }
  }
  
  const handleCloseRegister = () => {
    router.push('/register/close');
  }

  return (
    <div className="flex items-center gap-2">
      {status.isOpen ? (
        <>
            <div className="text-sm text-right">
                <p className="font-semibold">{status.current?.registerName || registerId}</p>
                <p className="text-xs text-muted-foreground">Float: {formatMoney(status.current?.floatAmount || 0)}</p>
            </div>
            <Button onClick={handleCloseRegister} variant="destructive" size="sm" disabled={busy}>Close Register</Button>
        </>
      ) : (
        <Button onClick={handleOpenRegister} size="sm" disabled={busy || !registerId}>
            Open Register
        </Button>
      )}
    </div>
  );
}
