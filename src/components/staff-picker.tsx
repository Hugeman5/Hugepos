'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type StaffListUser = {
  id: string;
  name: string;
  username?: string | null;
  role: string;
  imageUrl?: string | null;
};

type StaffPickerProps = {
  onSelect: (user: StaffListUser) => void;
  className?: string;
  includeAdmins?: boolean;
};

function getInitials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default function StaffPicker({ onSelect, className, includeAdmins = false }: StaffPickerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<StaffListUser[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        // Only fetch active users. We avoid filtering by exposeOnPinLogin to be resilient to missing data.
        const q = query(usersRef, where('active', '==', true), orderBy('name'));
        const snap = await getDocs(q);
        if (!isMounted) return;
        const list: StaffListUser[] = snap.docs
          .map((d) => {
            const u = d.data() as any;
            const role = String(u.role ?? '').toLowerCase();
            if (!includeAdmins && role === 'admin') return null;
            return {
              id: d.id,
              name: (u.name ?? u.displayName ?? u.username ?? '').toString(),
              username: (u.username ?? null) as string | null,
              role,
              imageUrl: (u.imageUrl ?? null) as string | null,
            } as StaffListUser;
          })
          .filter(Boolean) as StaffListUser[];
        setUsers(list);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void loadUsers();
    return () => {
      isMounted = false;
    };
  }, [includeAdmins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.username, u.role].some((v) => (v ?? '').toString().toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Input
        placeholder="Search staff by name or username"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No active users found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelect(u)}
              className="group rounded-lg border bg-card hover:bg-accent/40 transition-colors p-3 text-left flex items-center gap-3"
            >
              {u.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.imageUrl}
                  alt={u.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                  {getInitials(u.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">{u.name || u.username}</div>
                <div className="text-xs text-muted-foreground capitalize truncate">{u.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}