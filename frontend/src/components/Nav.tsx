'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Nav() {
  const { user, can, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  if (!user) return null;

  const links = [
    { href: '/', label: 'Restaurants', show: true },
    { href: '/orders', label: 'Orders', show: true },
    { href: '/payments', label: 'Payment methods', show: can('viewPayments') },
  ].filter((l) => l.show);

  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="font-display text-xl font-bold tracking-tight">Urban <span className="text-saffron">Eats</span></span>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${path === l.href ? 'bg-white/15 font-medium' : 'text-white/75 hover:bg-white/10'}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-saffron font-display font-bold text-ink">{user.name[0]}</span>
            <span className="leading-tight">
              <span className="block font-medium">{user.name}</span>
              <span className="block text-xs text-white/65">{user.role.toLowerCase()}{user.role !== 'ADMIN' && ` · ${user.country === 'INDIA' ? 'India' : 'America'}`}</span>
            </span>
          </span>
          <button className="btn border border-white/30 hover:bg-white/10" onClick={() => { logout(); router.replace('/login'); }}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
