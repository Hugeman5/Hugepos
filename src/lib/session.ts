
import { type User } from "./data";

export type SessionUser = Pick<User, 'id' | 'name' | 'role' | 'hourlyRate'>;
const KEY = 'session.user';

/**
 * Reads user session info from sessionStorage.
 * This is a client-side only function.
 * @returns The user session object, or null if not found.
 */
export function getSession(): (User & { uid: string, activeRegisterId?: string }) | null {
    if (typeof window !== 'undefined') {
        const storedSession = sessionStorage.getItem('mockUser');
        if (storedSession) {
            try {
                const user = JSON.parse(storedSession);
                 if (typeof user === 'object' && user !== null && 'uid' in user) {
                    return { id: user.uid, ...user };
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
            const sessionData = { ...u, uid: u.id };
            sessionStorage.setItem('mockUser', JSON.stringify(sessionData)); 
        } catch {}
    }
}
