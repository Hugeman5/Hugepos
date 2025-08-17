
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, KeyRound, Package, Warehouse, ChefHat, Route, BarChart3, Settings, Store, Map, HardDrive, SwatchBook, TicketPercent, Combine, ShoppingCart, FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const navItems = [
  { href: '/admin', label: 'Overview', icon: Home },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

const catalogItems = [
    { href: '/admin/menu', label: 'Menu Items', icon: Package },
    { href: '/admin/modifiers', label: 'Modifiers', icon: SwatchBook },
    { href: '/admin/promotions', label: 'Promotions', icon: TicketPercent },
];

const inventoryItems = [
    { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/admin/recipes', label: 'Recipes', icon: Combine },
];

const purchasingItems = [
    { href: '/admin/purchasing/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/purchasing/suppliers', label: 'Suppliers', icon: Users },
    { href: '/admin/purchasing/new', label: 'New Order', icon: FilePlus },
];

const usersItems = [
    { href: '/admin/users', label: 'Staff Users', icon: Users },
    { href: '/admin/roles', label: 'Roles', icon: KeyRound },
];

const operationsItems = [
    { href: '/admin/floor', label: 'Floor Plan', icon: Map },
    { href: '/admin/stations', label: 'KDS Stations', icon: ChefHat },
    { href: '/admin/routing', label: 'KDS Routing', icon: Route },
    { href: '/admin/registers', label: 'Registers', icon: Store },
    { href: '/admin/hardware', label: 'Hardware', icon: HardDrive },
];

const settingsItems = [
    { href: '/admin/settings', label: 'General', icon: Settings },
]

const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href) && (href !== '/admin' || pathname === '/admin');
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-brand-mute transition-all hover:text-brand-text hover:bg-brand-line',
        isActive && 'bg-brand-line text-brand-text'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

const NavGroup = ({ title, items }: { title: string; items: { href: string; label: string; icon: React.ElementType }[] }) => (
    <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm text-brand-text-dim hover:no-underline">
              <span>{title}</span>
            </AccordionTrigger>
            <AccordionContent className="pl-4 space-y-1">
                {items.map(item => <NavLink key={item.href} {...item} />)}
            </AccordionContent>
        </AccordionItem>
    </Accordion>
);


export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-brand-card p-4">
      <div className="text-2xl font-bold text-brand-accent mb-8">HUGEPOS</div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        <NavGroup title="Catalog" items={catalogItems} />
        <NavGroup title="Inventory" items={inventoryItems} />
        <NavGroup title="Purchasing" items={purchasingItems} />
        <NavGroup title="Users" items={usersItems} />
        <NavGroup title="Operations" items={operationsItems} />
        <NavGroup title="Settings" items={settingsItems} />
      </nav>
    </div>
  );
}
