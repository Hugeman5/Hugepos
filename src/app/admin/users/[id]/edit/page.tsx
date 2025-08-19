
"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";

type RepoUser = {
  id: string;
  name: string;
  role: "admin" | "cashier" | "kitchen" | "waiter";
  active?: boolean;
  exposeOnPinLogin?: boolean;
  pin?: string;
  pinHash?: string;
  hourlyRate?: number; // ZAR/h
};

type UsersResponse = RepoUser[] | { users: RepoUser[] };

export default function UserEditPage({
  params,
}: {
  // Next 15+ may provide params as a Promise in client components
  params: Promise<{ id: string }>;
}) {
  // ✅ Unwrap params with React.use()
  const { id: userId } = use(params);

  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RepoUser | null>(null);
  const [hourlyRate, setHourlyRate] = useState<string>("");

  // Load all users, then find this one
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/admin/users", { cache: "no-store" });
        if (!r.ok) throw new Error(`Failed to load users (${r.status})`);
        const data: UsersResponse = await r.json();
        const list = Array.isArray(data) ? data : data.users;
        const found = (list || []).find((u) => String(u.id) === String(userId)) || null;
        if (!ignore) {
          setUser(found);
          setHourlyRate(
            found && Number.isFinite(found.hourlyRate as any)
              ? String(found.hourlyRate)
              : "0"
          );
        }
      } catch (e: any) {
        if (!ignore) toast({ variant: "destructive", title: "Load error", description: e?.message || String(e) });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [userId, toast]);

  const canSave = useMemo(() => {
    const n = Number(hourlyRate);
    return user && Number.isFinite(n) && n >= 0;
  }, [user, hourlyRate]);

  async function saveHourly() {
    if (!user) return;
    const n = Number(hourlyRate);
    if (!Number.isFinite(n) || n < 0) {
      toast({ variant: "destructive", title: "Invalid rate", description: "Enter a non-negative number." });
      return;
    }
    const url = `/api/admin/users/${encodeURIComponent(user.id)}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: n }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      toast({ title: "Saved", description: `Hourly rate updated to ${formatMoney(n, { currency: "ZAR" })} / h` });
      // Refresh local copy
      setUser({ ...user, hourlyRate: n }); // ZAR/h
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save error", description: e?.message || String(e) });
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading user…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-500">User not found.</p>
        <Link href="/admin/users" className="text-amber-400 hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Staff User</h1>
        <Link href="/admin/users" className="text-amber-400 hover:underline">
          ← Back to Users
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={user.name} readOnly className="opacity-70" />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={user.role} readOnly className="opacity-70 capitalize" />
          </div>
          <div>
            <Label>User ID</Label>
            <Input value={user.id} readOnly className="opacity-70 font-mono" />
          </div>
          <div>
            <Label>PIN (hidden)</Label>
            <Input value="••••" readOnly className="opacity-70" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pay Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Hourly Rate (ZAR / hour)</Label>
            <Input
              inputMode="decimal"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value.replace(",", "."))}
              placeholder="0.00"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Used for live wage burn and payroll summaries.
            </p>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={saveHourly} disabled={!canSave}>
              Save Hourly Rate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
