export type Session = { uid: string; name: string; role: string };

const KEY = 'hugepos:session';

export function getSession(): Session | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as Session) : null;
	} catch {
		return null;
	}
}

export function setSession(s: Session | null): void {
	if (typeof window === 'undefined') return;
	try {
		if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
		else window.localStorage.removeItem(KEY);
	} catch {
		// ignore
	}
}