'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Row = { id:string; name:string; role:'admin'|'cashier'|'kitchen'|'waiter'; active:boolean; exposeOnPinLogin?:boolean; pin?:string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users').then(r=>r.json()).then(setRows).catch(()=>setRows([]));
  }, []);

  function onAdd() {
    setRows(prev => [...prev, { id:'', name:'', role:'cashier', active:true, exposeOnPinLogin:true, pin:'' }]);
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rows) });
      if (!res.ok) throw new Error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-background">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rows.map((u, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-1">
                  <Label>ID</Label>
                  <Input value={u.id} onChange={e=>{
                    const v=e.target.value; setRows(prev=>prev.map((r,i)=>i===idx?{...r,id:v}:r));
                  }} />
                </div>
                <div className="col-span-2">
                  <Label>Name</Label>
                  <Input value={u.name} onChange={e=>{
                    const v=e.target.value; setRows(prev=>prev.map((r,i)=>i===idx?{...r,name:v}:r));
                  }} />
                </div>
                <div className="col-span-1">
                  <Label>Role</Label>
                  <select className="border h-10 rounded px-2 w-full" value={u.role} onChange={e=>{
                    const v=e.target.value as Row['role']; setRows(prev=>prev.map((r,i)=>i===idx?{...r,role:v}:r));
                  }}>
                    <option value="admin">admin</option>
                    <option value="cashier">cashier</option>
                    <option value="kitchen">kitchen</option>
                    <option value="waiter">waiter</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <Label>Active</Label>
                  <input type="checkbox" className="h-5 w-5" checked={u.active} onChange={e=>{
                    const v=e.target.checked; setRows(prev=>prev.map((r,i)=>i===idx?{...r,active:v}:r));
                  }} />
                </div>
                <div className="col-span-1">
                  <Label>PIN</Label>
                  <Input value={u.pin ?? ''} onChange={e=>{
                    const v=e.target.value; setRows(prev=>prev.map((r,i)=>i===idx?{...r,pin:v}:r));
                  }} />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" onClick={onAdd}>Add</Button>
              <Button type="button" onClick={onSave} disabled={saving}>{saving? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}