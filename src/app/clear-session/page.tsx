import { redirect } from 'next/navigation';
import { setSession } from '@/lib/session';

export default function ClearSessionPage() {
	if (typeof window !== 'undefined') {
		setSession(null);
		window.location.replace('/login?force=1');
		return null;
	}
	redirect('/login?force=1');
}