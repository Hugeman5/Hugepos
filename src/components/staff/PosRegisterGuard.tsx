
import React, { useEffect, useState, useCallback } from 'react';
import { ensureRegisterOpen } from '@/hooks/useEnsureRegisterOpen';
import { getClockStatus, postClockIn } from '@/app/api/timeclock';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/data';
import { Button } from '../ui/Button';

export function PosRegisterGuard({ user, onOpened }: { user: User; onOpened?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const { toast } = useToast();

  const checkClockStatus = useCallback(async () => {
    getClockStatus(user.id).then(s => setClockedIn(!!s.active)).catch(() => setClockedIn(false));
  }, [user.id]);
  
  useEffect(() => {
    checkClockStatus();
  }, [checkClockStatus]);

  async function clockInAndOpen() {
    setBusy(true); setErr(null);
    try { 
      await postClockIn({ userId: user.id, stationId: 'front', role: 'cashier', hourlyRate: user.hourlyRate }); 
      setClockedIn(true);
      toast({title: "Clocked In", description: "You are now on the clock."});
    } catch { 
      setErr('CLOCKIN_FAILED'); 
      setBusy(false); 
      return; 
    }
    
    // Slight delay to allow UI to update if needed, then open register
    setTimeout(async () => {
        const res = await ensureRegisterOpen(user, user.activeRegisterId || 'checkout_counter', 500, 'POS quick open');
        setBusy(false);
        if (res.opened || res.alreadyOpen) {
          toast({title: "Register Open", description: "You can now process sales."});
          onOpened?.();
        } else if (res.error) {
          setErr(res.error);
        }
    }, 250);
  }

  async function openOnly() {
    setBusy(true); setErr(null);
    const res = await ensureRegisterOpen(user, user.activeRegisterId || 'checkout_counter', 500, 'POS quick open');
    setBusy(false);
    if (res.opened || res.alreadyOpen) onOpened?.(); else if (res.error) setErr(res.error);
  }

  const openDisabled = !clockedIn || busy;

  return (
    <div className="p-4 bg-brand-muted/40 rounded-lg border border-brand-line text-center">
      <div className="flex items-center justify-center gap-2 font-semibold text-yellow-400 mb-2">
        <span>⚠️</span>
        <strong>No Open Register</strong>
      </div>
      <p className="text-sm text-brand-mute mb-4">A register shift must be opened before processing sales.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        {!clockedIn && <Button onClick={clockInAndOpen} disabled={busy} className="flex-1 bg-green-600 hover:bg-green-700"> {busy ? 'Working…' : 'Clock In & Open'} </Button>}
        <Button onClick={openOnly} disabled={openDisabled} title={clockedIn ? 'Open Register' : 'Clock in first'} className="flex-1">Open Register</Button>
      </div>
      {err && <div className="text-xs text-destructive mt-2">Failed: {err}</div>}
    </div>
  );
}
