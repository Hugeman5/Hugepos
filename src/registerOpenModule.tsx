// src/registerOpenModule.tsx
// Single-module version to avoid multiple React imports across concatenated snippets.
// Contains: fetchJson, Register & Timeclock API helpers, Toast, RegisterOpenPage, POS guard helpers, AppRoutes, self-tests.

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// ------------------------------- HTTP ---------------------------------------
export class HttpError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any) {
    super(typeof data?.error === 'string' ? data.error : `HTTP ${status}`);
    this.status = status;
    this.data = data;
  }
}

export async function fetchJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new HttpError(res.status, json);
  return json as T;
}

// ------------------------------- API ----------------------------------------
export type RegisterState = 'OPEN' | 'CLOSED';
export interface RegisterStatus {
  state: RegisterState;
  currentShift: null | {
    id: string;
    openedAt: string;
    openedBy: string;
  };
  today?: { totalCash: number; totalCard: number; movements: number };
}

export async function getRegisterStatus(): Promise<RegisterStatus> {
  return fetchJson<RegisterStatus>('/api/register/status');
}

export async function openRegister(params: {
  registerId: string;
  openingFloat: number;
  user: { id: string; name: string };
  notes?: string;
}) {
  return fetchJson<{ ok: true; shiftId: string } | { ok: false; error: string; status?: number }>(
    '/api/register/open',
    { method: 'POST', body: JSON.stringify(params) }
  );
}

export type ClockStatus = { active: boolean; shift?: any };
export async function getClockStatus(userId: string): Promise<ClockStatus> {
  try {
    const qs = new URLSearchParams({ userId }).toString();
    return await fetchJson<ClockStatus>(`/api/timeclock/status?${qs}`);
  } catch (e: any) {
    // Why: timeclock must not block opening the register; treat failures as inactive
    return { active: false };
  }
}

// ------------------------------ UI: Toast -----------------------------------
export type ToastKind = 'success' | 'error' | 'info';
export function Toast({ kind = 'info', message }: { kind?: ToastKind; message: string }) {
  const bg = kind === 'success' ? '#134e4a' : kind === 'error' ? '#7f1d1d' : '#1f2937';
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: bg,
        color: 'white',
        padding: '10px 12px',
        borderRadius: 12,
        boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
}

// ------------------------ POS Guard + Open helper ---------------------------
export type EnsureOpenResult = { opened: boolean; alreadyOpen: boolean; error?: string };

/**
 * Ensure the register is open. Does NOT require clock-in to proceed.
 * - Check /api/register/status
 * - If CLOSED → call /api/register/open
 * - Handle 409 REGISTER_ALREADY_OPEN gracefully
 */
export async function ensureRegisterOpen(
  userId: string,
  userName: string,
  registerId: string,
  openingFloat: number,
  notes?: string
): Promise<EnsureOpenResult> {
  try {
    const s = await getRegisterStatus();
    if (s.state === 'OPEN') return { opened: false, alreadyOpen: true };
    const r = await openRegister({ userId, openingFloat, registerId, user: { id: userId, name: userName }, notes });
    if ((r as any).ok) return { opened: true, alreadyOpen: false };
    return { opened: false, alreadyOpen: false, error: (r as any).error || 'UNKNOWN' };
  } catch (err: any) {
    if (err?.status === 409 && err?.data?.error === 'REGISTER_ALREADY_OPEN') {
      return { opened: false, alreadyOpen: true };
    }
    return { opened: false, alreadyOpen: false, error: err?.data?.error || 'NETWORK' };
  }
}

/**
 * Minimal guard widget for POS right panel.
 * Shows the screenshot’s message and wires the Open Register button.
 */
export function PosRegisterGuard({ userId, userName, registerId, onOpened }: { userId: string; userName: string; registerId: string; onOpened?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setBusy(true); setErr(null);
    const res = await ensureRegisterOpen(userId, userName, registerId, 500, 'POS quick open');
    setBusy(false);
    if (res.opened || res.alreadyOpen) {
      onOpened?.();
    } else if (res.error) {
      setErr(res.error);
    }
  }

  return (
    <div style={{ padding: 16, background: '#0b0f12', color: '#e5e7eb', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <strong>No Open Register</strong>
      </div>
      <p style={{ color: '#9ca3af', marginBottom: 12 }}>A register shift must be opened before processing sales.</p>
      <button
        onClick={onClick}
        disabled={busy}
        style={{
          background: busy ? '#1f2a37' : '#1380fa',
          color: 'white',
          padding: '10px 14px',
          borderRadius: 10,
          border: 'none',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontWeight: 700,
        }}
      >
        {busy ? 'Opening…' : 'Open Register'}
      </button>
      {err && <div style={{ color: '#f87171', marginTop: 8 }}>Failed: {err}</div>}
    </div>
  );
}

// --------------------------- Page: RegisterOpen ------------------------------
export function RegisterOpenPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const [openingFloat, setOpeningFloat] = useState<number>(500);
  const [selectedRegister, setSelectedRegister] = useState<string>('waiter_1');
  const activeUser = { id: 'waiter1', name: 'Waiter One' }; // TODO: read from session

  useEffect(() => {
    (async () => {
      try {
        const s = await getRegisterStatus();
        if (s.state === 'OPEN') {
          setToast({ kind: 'info', msg: 'Register already open — redirecting…' });
          nav('/register');
        }
      } catch {
        // Intentionally ignore; status check should not block the UI
      }
    })();
  }, [nav]);

  async function handleOpenShift() {
    setBusy(true);
    const res = await ensureRegisterOpen(activeUser.id, activeUser.name, selectedRegister, openingFloat, `Station: ${selectedRegister}`);
    setBusy(false);
    if (res.opened || res.alreadyOpen) {
      setToast({ kind: 'success', msg: res.alreadyOpen ? 'Register already open.' : 'Register opened.' });
      nav('/register');
    } else if (res.error) {
      setToast({ kind: 'error', msg: `Failed to open: ${res.error}` });
    }
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f12', color: '#fff', display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: 520,
          background: '#121821',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#7dd3fc' }}>Open Register</h1>
        <p style={{ color: '#93a3b8', marginBottom: 16 }}>
          Start a new shift by selecting a register and entering the opening cash float.
        </p>

        <label style={{ display: 'block', fontSize: 14, color: '#9fb3c8' }}>Register</label>
        <select
          value={selectedRegister}
          onChange={(e) => setSelectedRegister(e.target.value)}
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            background: '#0f1720',
            color: '#e5e7eb',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #1f2a37',
          }}
        >
          <option value="waiter_1">Waiter 1</option>
          <option value="waiter_2">Waiter 2</option>
          <option value="checkout_counter">Front</option>
        </select>

        <label style={{ display: 'block', fontSize: 14, color: '#9fb3c8' }}>Opening Float</label>
        <input
          type="number"
          inputMode="decimal"
          value={openingFloat}
          onChange={(e) => setOpeningFloat(Number(e.target.value))}
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            background: '#0f1720',
            color: '#e5e7eb',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #1f2a37',
          }}
        />

        <button
          data-testid="register-open-button"
          onClick={handleOpenShift}
          disabled={busy}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontWeight: 700,
            borderRadius: 12,
            background: busy ? '#1f2a37' : '#1380fa',
            color: 'white',
            border: 'none',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Opening…' : 'Open Shift'}
        </button>
      </div>
      {toast && <Toast kind={toast.kind} message={toast.msg} />}
    </div>
  );
}

// --------------------------- App Routes (example) ---------------------------
export default function AppRoutes() {
  // Example of using the POS guard inline (replace with your real cart panel)
  const ExamplePosPanel = () => (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#e5e7eb' }}>Current Order</h2>
      <PosRegisterGuard userId="waiter1" userName="Waiter One" registerId="checkout_counter" onOpened={() => console.log('Register is open, refresh POS state')} />
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register/open" element={<RegisterOpenPage />} />
        <Route path="/register" element={<div>Register Status</div>} />
        <Route path="/pos" element={<ExamplePosPanel />} />
        {/* other routes */}
      </Routes>
    </BrowserRouter>
  );
}

// ------------------------------ Self-tests ----------------------------------
// Decision logic tests for gating and open flow (no network)

type GateDecision = 'redirect' | 'open';
function decideAction(status: RegisterStatus): GateDecision {
  return status.state === 'OPEN' ? 'redirect' : 'open';
}

function runSelfTests() {
  const tests: Array<{ name: string; input: RegisterStatus; expect: GateDecision }> = [
    { name: 'redirect when OPEN', input: { state: 'OPEN', currentShift: { id: 'x', openedAt: '', openedBy: '' } }, expect: 'redirect' },
    { name: 'open when CLOSED', input: { state: 'CLOSED', currentShift: null }, expect: 'open' },
    { name: 'redirect when OPEN with today totals', input: { state: 'OPEN', currentShift: { id: 'y', openedAt: '', openedBy: '' }, today: { totalCash: 100, totalCard: 0, movements: 1 } }, expect: 'redirect' },
  ];
  const results = tests.map((t) => ({ name: t.name, pass: decideAction(t.input) === t.expect }));
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.table(results);
  }
}

if (typeof window !== 'undefined') runSelfTests();
