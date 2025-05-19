
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Missions', icon: ListChecks },
  { href: '/habits', label: 'Disciplines', icon: Repeat },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card text-card-foreground shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1),0_-1px_3px_-1px_rgba(0,0,0,0.06)]">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-md transition-colors w-full text-muted-foreground hover:text-primary',
              pathname === item.href ? 'text-primary font-semibold bg-primary/10' : 'hover:bg-accent/50'
            )}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5 mb-0.5", pathname === item.href ? 'text-primary' : '')} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
