
"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type State = "off" | "on" | "break";
type UserSession = {
    uid: string;
    name: string;
    role: string;
};

export default function ShiftControls() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [state, setState] = useState<State>("off");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  
  useEffect(() => {
    // On component mount, get user from session storage
    const storedSession = sessionStorage.getItem('mockUser');
    if (storedSession) {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
    }
  }, []);

  const userId = session?.uid;

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`/api/shifts/active?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Failed to fetch");
      setState(d?.state ?? "off");
      setErr("");
    } catch (e:any) {
      setErr(e?.message || "Status error");
    }
  }, [userId]);

  useEffect(() => { 
    if (userId) {
        refresh(); 
        const t = setInterval(refresh, 10000);
        return () => clearInterval(t);
    }
  }, [userId, refresh]);

  async function call(url: string) {
    if (!userId) return;
    setBusy(true);
    try {
      const r = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ userId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Action failed");
      await refresh();
    } catch (e:any) {
      setErr(e?.message || "Action error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {state === "off" && (
        <Button disabled={busy || !userId} onClick={() => call("/api/shifts/clock-in")}>Clock In</Button>
      )}
      {state === "on" && (
        <>
          <Button variant="secondary" disabled={busy} onClick={() => call("/api/shifts/break-start")}>Start Break</Button>
          <Button variant="destructive" disabled={busy} onClick={() => call("/api/shifts/clock-out")}>Clock Out</Button>
        </>
      )}
      {state === "break" && (
        <Button disabled={busy} onClick={() => call("/api/shifts/break-end")}>End Break</Button>
      )}
      {err && <span className="text-xs text-red-500 ml-2">{err}</span>}
    </div>
  );
}
