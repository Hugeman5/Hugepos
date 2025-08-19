
import { type User } from "./data";

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
