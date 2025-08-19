import { headers } from "next/headers";
import { type User } from "./data";

/**
 * Reads user session info from a custom request header.
 * In a real app, this would verify a JWT or session cookie.
 * @returns The user session object, or null if not found.
 */
export function getSession(): Omit<User, 'pin' | 'pinHash'> | null {
    const headersList = headers();
    const sessionHeader = headersList.get('X-User-Session');

    if (!sessionHeader) {
        return null;
    }
    try {
        const user = JSON.parse(sessionHeader);
        // Basic validation of the parsed object
        if (typeof user === 'object' && user !== null && 'uid' in user && 'name' in user && 'role' in user) {
            return {
                id: user.uid,
                name: user.name,
                role: user.role,
                active: true, // Assuming active if in session
                exposeOnPinLogin: false, // Defaulting as it's not critical for the session
                hourlyRate: user.hourlyRate || 0,
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to parse user session header:", error);
        return null;
    }
}
