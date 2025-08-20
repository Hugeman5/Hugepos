
import { getRegisterStatus, postRegisterOpen } from '@/app/api/register';
import { getClockStatus } from '@/app/api/timeclock';
import { type User } from '@/lib/data';

export type EnsureResult = {
  opened: boolean;
  alreadyOpen: boolean;
  error?: string;
};

/**
 * Checks timeclock and register status, then opens a register if needed.
 * This provides a consistent, gated flow for opening a register.
 * @returns A result object indicating success, failure, or if it was already open.
 */
export async function ensureRegisterOpen(
  user: User,
  registerId: string,
  openingFloat: number,
  notes?: string
): Promise<EnsureResult> {
  // 1. Check if user is clocked in
  try {
    const tc = await getClockStatus(user.id);
    if (!tc.active) {
      return { opened: false, alreadyOpen: false, error: 'NOT_CLOCKED_IN' };
    }
  } catch (e: any) {
    return { opened: false, alreadyOpen: false, error: 'TIMECLOCK_UNAVAILABLE' };
  }

  // 2. Check if register is already open
  try {
    const s = await getRegisterStatus();
    if (s.currentShift?.registerId === registerId && s.state === 'OPEN') {
      return { opened: false, alreadyOpen: true };
    }
    // A shift is open on a DIFFERENT register, which is not allowed in some models.
    if(s.state === 'OPEN') {
      return { opened: false, alreadyOpen: false, error: `A shift is already open on another register (${s.currentShift?.registerId})` };
    }
  } catch (e: any) {
    // If status check fails, proceed cautiously
    console.warn("Could not check register status before opening.", e);
  }

  // 3. Attempt to open the register
  try {
    const r = await postRegisterOpen({ userId: user.id, userName: user.name, registerId, openingFloat, notes });
    if ((r as any).ok) {
      return { opened: true, alreadyOpen: false };
    }
    return { opened: false, alreadyOpen: false, error: (r as any).error || 'UNKNOWN_OPEN_ERROR' };
  } catch (e: any) {
    if (e?.status === 409 && e?.data?.error === 'REGISTER_ALREADY_OPEN') {
      return { opened: false, alreadyOpen: true };
    }
     if (e?.status === 403 && e?.data?.error === 'NOT_CLOCKED_IN') {
      return { opened: false, alreadyOpen: false, error: 'NOT_CLOCKED_IN' };
    }
    return { opened: false, alreadyOpen: false, error: e?.data?.error || 'NETWORK_ERROR' };
  }
}
