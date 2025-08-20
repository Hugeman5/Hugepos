
import { type User } from "./data";

export type SessionUser = Pick<User, 'id' | 'name' | 'role' | 'hourlyRate'>;
const KEY = 'session.user';

/**
 * Reads user session info from sessionStorage.
 * This is a client-side only function.
 * @returns The user session object, or null if not found.
 */
export function getSession(): (SessionUser & { uid: string, activeRegisterId?: string }) | null {
    if (typeof window !== 'undefined') {
        const storedSession = sessionStorage.getItem(KEY);
        if (storedSession) {
            try {
                const user = JSON.parse(storedSession);
                 if (typeof user === 'object' && user !== null && 'id' in user) {
                    return { ...user, uid: user.id };
                 }
            } catch (error) {
                console.error("Failed to parse user session from sessionStorage:", error);
                return null;
            }
        }
    }
    return null;
}

export function setSessionUser(u: SessionUser) {
    if (typeof window !== 'undefined') {
        try { 
            sessionStorage.setItem(KEY, JSON.stringify(u)); 
        } catch {}
    }
}
