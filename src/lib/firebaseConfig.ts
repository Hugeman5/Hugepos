import { USE_FIREBASE } from "@/config/featureFlags";

// Lazily initialize Firebase only when enabled
let db: any = null;

if (USE_FIREBASE) {
	(async () => {
		const { initializeApp, getApps, getApp } = await import('firebase/app');
		const { getFirestore } = await import('firebase/firestore');
		const firebaseConfig = {
			apiKey: "AIzaSyCAuMZIM-pdIGVrPwc4sE5tpBQACgcY_Ks",
			authDomain: "hugepos-beed0.firebaseapp.com",
			projectId: "hugepos-beed0",
			storageBucket: "hugepos-beed0.firebasestorage.app",
			messagingSenderId: "1040281110757",
			appId: "1:1040281110757:web:fa040f5dfb139e6a0fac0c"
		};
		const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
		db = getFirestore(app);
	})();
}

export { db };
