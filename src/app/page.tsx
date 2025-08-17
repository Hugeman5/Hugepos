
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LogIn, Users, ShieldCheck } from 'lucide-react';


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[--bg] text-[--text]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[--accent]">
          HugePOS
        </h1>
        <p className="text-[--text-dim] mt-2 text-lg">
          A blazing fast, modern Point of Sale system.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="hover:shadow-soft transition-shadow duration-300 p-6">
            <h2 className="text-xl font-semibold flex items-center gap-3 mb-2">
              <ShieldCheck className="h-6 w-6 text-[--accent]" />
              Admin & Manager Login
            </h2>
            <p className="text-[--text-dim] mb-4">
              Access the back-office to manage products, users, and view reports.
            </p>
            <Link href="/login-admin">
              <Button className="w-full">
                <LogIn className="mr-2 h-4 w-4" /> Go to Admin Login
              </Button>
            </Link>
        </Card>
        <Card className="hover:shadow-soft transition-shadow duration-300 p-6">
            <h2 className="text-xl font-semibold flex items-center gap-3 mb-2">
               <Users className="h-6 w-6 text-[--accent]" />
              Staff Login
            </h2>
            <p className="text-[--text-dim] mb-4">
              Clock-in with your PIN to access cashier, waiter, or kitchen views.
            </p>
            <Link href="/login-staff">
              <Button className="w-full">
                <LogIn className="mr-2 h-4 w-4" /> Go to Staff Login
              </Button>
            </Link>
        </Card>
      </div>
      <footer className="mt-12 text-center text-[--text-dim] text-sm">
        <p>
          Copyright © {new Date().getFullYear()} HugePOS. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
