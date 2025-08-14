'use client';

import { useEffect, useState } from 'react';

export default function DebugLoginPage() {
  const [users, setUsers] = useState<any>(null);
  const [verify, setVerify] = useState<any>(null);
  const [verifyStatus, setVerifyStatus] = useState<number|undefined>();

  useEffect(() => {
    fetch('/api/mock-auth/active-users').then(async r=>{
      const json = await r.json();
      setUsers({ status:r.status, json });
    }).catch(e=>setUsers({ error: String(e) }));

    fetch('/api/mock-auth/verify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identifier:'eugene', pin:'5245' })
    }).then(async r=>{
      const json = await r.json();
      setVerify(json); setVerifyStatus(r.status);
    }).catch(e=>setVerify({ error: String(e) }));
  }, []);

  return (
    <main className="p-4 space-y-4">
      <pre className="whitespace-pre-wrap break-all">/active-users: {JSON.stringify(users, null, 2)}</pre>
      <pre className="whitespace-pre-wrap break-all">/verify ({verifyStatus}): {JSON.stringify(verify, null, 2)}</pre>
    </main>
  );
}