
import { useEffect, useState } from 'react';
export type SessionUser = { id: string; name?: string; role?: string; hourlyRate?: number };
const KEY = 'session.user';
export function setSessionUser(u: SessionUser) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch {} }
export function getSessionUser(): SessionUser | null { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export function useSessionUser(): SessionUser | null { const [u,setU]=useState<SessionUser|null>(()=>getSessionUser()); useEffect(()=>{ const on=(e:StorageEvent)=>{ if(e.key===KEY&&e.newValue) setU(JSON.parse(e.newValue));}; window.addEventListener('storage',on); return()=>window.removeEventListener('storage',on);},[]); return u; }
export function useSessionUserId(): string | null { return useSessionUser()?.id ?? null; }
