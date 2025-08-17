import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Users } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary">
          FirePOS
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          A blazing fast, modern Point of Sale system.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="bg-card hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-xl">
              <ShieldCheck className="h-6 w-6 text-accent" />
              Admin & Manager Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Access the back-office to manage products, users, and view reports.
            </p>
            <Button asChild className="w-full">
              <Link href="/login-admin">
                <LogIn className="mr-2 h-4 w-4" /> Go to Admin Login
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-card hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-xl">
               <Users className="h-6 w-6 text-accent" />
              Staff Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Clock-in with your PIN to access cashier, waiter, or kitchen views.
            </p>
            <Button asChild className="w-full">
              <Link href="/login-staff">
                <LogIn className="mr-2 h-4 w-4" /> Go to Staff Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>
          Copyright © {new Date().getFullYear()} FirePOS. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
