import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Link2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type DashboardHeaderProps = {
  title: string;
  userName: string;
  userRole: string;
  shiftStatus?: { registerName: string, shiftId: string } | null;
};

export default function DashboardHeader({ title, userName, userRole, shiftStatus }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <h1 className="flex-1 text-xl font-semibold font-headline">{title}</h1>
      <div className="flex items-center gap-4">
        {shiftStatus && (
            <div className="text-sm text-right">
                <p className="font-semibold">{shiftStatus.registerName}</p>
                <p className="text-xs text-muted-foreground">Shift: {shiftStatus.shiftId}</p>
            </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://avatar.vercel.sh/${userName.replace(/\s/g, '')}.png`} alt={userName} />
                <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex flex-col items-start !pointer-events-none p-2">
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/register/close">
                <Link2 className="mr-2 h-4 w-4" />
                <span>Register Actions</span>
              </Link>
            </DropdownMenuItem>
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
                <span>Logout</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
