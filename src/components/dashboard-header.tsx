
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LogOut, Link2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Avatar from '@/components/ui/Avatar';
import ShiftControls from './staff/ShiftControls';
import { type User, type Shift } from '@/lib/data';
import ShiftWidget from './timeclock/ShiftWidget';

type DashboardHeaderProps = {
  title: string;
  user: User;
  shiftStatus?: Shift | null;
};

export default function DashboardHeader({ title, user, shiftStatus }: DashboardHeaderProps) {
  if (!user) return null;
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <h1 className="flex-1 text-xl font-semibold font-headline">{title}</h1>
      <div className="flex items-center gap-4">
        {user.role !== 'admin' && <ShiftWidget />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="relative h-10 w-10 rounded-full !p-0">
               <Avatar name={user?.name ?? '?'} src={(user as any)?.imageUrl} size={40} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex flex-col items-start !pointer-events-none p-2">
                <p className="font-medium">{user.name ?? '...'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role ?? '...'}</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Link2 className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Switch User / Logout</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
