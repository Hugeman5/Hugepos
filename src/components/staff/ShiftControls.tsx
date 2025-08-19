
"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/session";

type State = "off" | "on" | "break";

export default function ShiftControls() {
  const sess = getSession();
  const userId = sess?.id;

  const [state, setState] = useState<State>("off");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [refresh]);

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
