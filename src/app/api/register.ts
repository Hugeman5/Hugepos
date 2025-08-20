
import { fetchJson } from '@/lib/http';
import { type RegisterShift } from '@/lib/repos/registerRepo';

export type RegisterState = 'OPEN' | 'CLOSED';
export interface RegisterStatus { state: RegisterState; currentShift: RegisterShift | null; }

export const getRegisterStatus = () => fetchJson<RegisterStatus>('/api/register/status');

export const postRegisterOpen = (p: { 
    userId: string;
    userName: string;
    registerId: string;
    openingFloat: number;
    notes?: string 
}) => fetchJson('/api/register/open', { method: 'POST', body: JSON.stringify(p) });
