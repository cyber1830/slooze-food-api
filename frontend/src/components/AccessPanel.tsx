'use client';
import { useAuth } from '@/lib/auth';
import { Action } from '@/lib/policy';

const ROWS: [Action, string][] = [
  ['viewCatalog', 'Browse restaurants and menus'],
  ['createOrder', 'Add dishes to an order'],
  ['placeOrder', 'Check out and pay'],
  ['cancelOrder', 'Cancel orders'],
  ['managePayments', 'Change payment methods'],
];

export default function AccessPanel() {
  const { user, can } = useAuth();
  if (!user) return null;
  const country = user.country === 'INDIA' ? 'India' : 'America';
  const scope = user.role === 'ADMIN' ? 'All countries, all orders' : user.role === 'MANAGER' ? `Everything in ${country}` : `Your own orders in ${country}`;
  return (
    <section className="panel h-fit">
      <h2 className="font-display text-lg font-bold">Your access</h2>
      <p className="mt-1 rounded-md bg-teal-soft px-3 py-2 text-sm text-teal-dark">{scope}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {ROWS.map(([action, label]) => {
          const ok = can(action);
          return (
            <li key={action} className={`flex items-center gap-2 ${ok ? '' : 'text-ink/40 line-through'}`}>
              <span aria-hidden className={`grid h-5 w-5 place-items-center rounded-full text-xs ${ok ? 'bg-teal text-white' : 'bg-ink/10'}`}>{ok ? '✓' : '✕'}</span>
              <span className="sr-only">{ok ? 'Allowed:' : 'Not allowed:'}</span>{label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
