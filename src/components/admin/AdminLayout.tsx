'use client';
import AdminSidebar from './AdminSidebar';
import { useRouter } from 'next/navigation';

export default function AdminLayout({title, children}:{title?:string;children:React.ReactNode}){
  const router = useRouter();
  
  const handleLogout = () => {
    // In a real app, this would call an API endpoint to clear the session.
    // For now, we just redirect.
    router.push('/'); 
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-r border-brand-line hidden md:block"><AdminSidebar/></aside>
      <main className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-brand-line sticky top-0 bg-brand-bg/80 backdrop-blur-sm z-10">
          <h1 className="text-xl font-semibold">{title ?? 'Admin'}</h1>
          <button
            className="text-sm bg-brand-accent text-white px-3 py-2 rounded-lg"
            onClick={handleLogout}>
            Switch user / Logout
          </button>
        </header>
        <div className="p-5 flex-1">{children}</div>
      </main>
    </div>
  );
}
