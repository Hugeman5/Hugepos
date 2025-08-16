'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, KeyRound, Package, UploadCloud, Warehouse, ChefHat, Route, BarChart3, Settings, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/roles', label: 'Roles', icon: KeyRound },
  { href: '/admin/menu', label: 'Menu', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/stations', label: 'Stations', icon: ChefHat },
  { href: '/admin/routing', label: 'Routing', icon: Route },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/registers', label: 'Registers', icon: Store },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-brand-card p-4">
      <div className="text-2xl font-bold text-brand-accent mb-8">HUGEPOS</div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-brand-mute transition-all hover:text-brand-text hover:bg-brand-line',
              (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')) && 'bg-brand-line text-brand-text'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
