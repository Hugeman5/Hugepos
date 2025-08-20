
"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { getSession, type SessionUser } from "@/lib/session";
import { getClockStatus, postClockIn, postClockOut, postBreakStart, postBreakEnd } from '@/app/api/timeclock';
import { type ActiveShift } from "@/lib/repos/timeclockRepo";

export default function ShiftWidget({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'in' | 'out' | 'break' | 'unknown'>('unknown');
  const [session, setSession] = useState<SessionUser | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const user = getSession();
    if (!user) {
        setSession(null);
        setStatus('unknown');
        return;
    }
    setSession(user);

    try {
        const data = await getClockStatus(user.id);

        if (!data.active) {
            setStatus('out');
        } else if (data.shift?.breaks.some(b => !b.end)) {
            setStatus('break');
        } else {
            setStatus('in');
        }
    } catch (e) {
        setStatus('unknown');
    }
  }, []);

  useEffect(()=>{ 
    refresh(); 
  },[refresh]);

  async function punch(fn: (p: {userId: string}) => Promise<any>, successMsg: string) {
    if (!session) return;
    setBusy(true);
    try {
      await fn({ userId: session.id });
      toast({ title: "Success", description: successMsg });
      await refresh();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally { 
        setBusy(false); 
    }
  }

  const clockIn = () => punch(postClockIn, 'You are now clocked in.');
  const clockOut = () => punch(postClockOut, 'You have been clocked out.');
  const startBreak = () => punch(postBreakStart, 'You are now on break.');
  const endBreak = () => punch(postBreakEnd, 'You are back from break.');

  if (!session) return null;

  const rateText = session.hourlyRate ? ` · ${formatMoney(session.hourlyRate)}/h` : '';

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-4 text-sm"}>
        <div className="flex flex-col text-right">
            <span className="font-semibold">{session.name}</span>
            <span className="text-xs text-muted-foreground">
                {status === 'in' ? 'Clocked In' : (status === 'break' ? 'On Break' : 'Clocked Out')}
                {status === 'in' && rateText}
            </span>
        </div>
        
        {status === 'out' && <Button size="sm" disabled={busy} onClick={clockIn}>Clock In</Button>}

        {status === 'in' && (
            <>
                <Button size="sm" variant="secondary" disabled={busy} onClick={startBreak}>Start Break</Button>
                <Button size="sm" variant="destructive" disabled={busy} onClick={clockOut}>Clock Out</Button>
            </>
        )}

        {status === 'break' && (
             <Button size="sm" disabled={busy} onClick={endBreak}>End Break</Button>
        )}
    </div>
  );
}
