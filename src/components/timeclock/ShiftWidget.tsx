
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";

type UserSession = {
    uid: string;
    name: string;
    role: string;
    hourlyRate?: number;
};

export default function ShiftWidget({ compact=false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<"in"|"out"|"breakStart"|"breakEnd"|null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const { toast } = useToast();

  const refresh = async () => {
    // Restore session
    const storedSession = sessionStorage.getItem('mockUser');
    if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        setSession(parsedSession);
    }
    
    // Pull last 1 day punches for status
    const from = new Date(Date.now()-24*3600e3).toISOString();
    try {
        const r = await fetch(`/api/timeclock/punches?from=${from}`, { cache:"no-store" });
        if (!r.ok) return;
        const rows: Array<{type:string; ts:string}> = await r.json();
        const lastType = rows.length ? rows[rows.length-1].type as any : null;
        setLast(lastType);
    } catch (e) {
        // fail silently on refresh
    }
  };

  useEffect(()=>{ 
    refresh(); 
  },[]);

  async function punch(type:"in"|"out") {
    setBusy(true);
    const sessionHeader = sessionStorage.getItem('mockUser') || '';
    try {
      const res = await fetch("/api/timeclock/punch", {
        method:"POST",
        headers:{ 
            "Content-Type":"application/json",
            "X-User-Session": sessionHeader
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        toast({ title: "Success", description: `You have been clocked ${type}.` });
        await refresh();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Punch failed");
      }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally { 
        setBusy(false); 
    }
  }

  const clockedIn = last === "in" || last === "breakEnd";
  const onBreak = last === "breakStart";
  
  const rateText = session?.hourlyRate ? ` · ${formatMoney(session.hourlyRate)}/h` : '';

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-8"}>
      <div className="text-xs opacity-70">
        Status: {clockedIn ? `Clocked in` : (onBreak ? `On Break` : `Clocked out`)}
        {rateText}
      </div>
      {!clockedIn && !onBreak ? (
        <Button size="sm" disabled={busy} onClick={()=>punch("in")}>Clock In</Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={busy} onClick={()=>punch("out")}>Clock Out</Button>
      )}
    </div>
  );
}
