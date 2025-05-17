"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListChecks, Repeat, Settings, UserCircle2 } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Missions', icon: ListChecks },
  { href: '/habits', label: 'Disciplines', icon: Repeat },
  // { href: '/profile', label: 'Profile', icon: UserCircle2 },
  // { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground p-4 hidden md:flex">
      <nav className="flex flex-col space-y-2 mt-16"> {/* Added margin top to clear header */}
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start text-base py-6',
              pathname === item.href 
                ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-6 w-6" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
