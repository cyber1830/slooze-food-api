'use client';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { useState } from 'react';
import AccessPanel from '@/components/AccessPanel';
import Skeleton from '@/components/Skeleton';
import { useRequireAuth } from '@/lib/auth';
import { CART, CHANGE_CART_ITEM, RESTAURANTS } from '@/lib/gql';
import { Country, money } from '@/lib/policy';

interface MenuItem { id: string; name: string; description: string; price: number }
interface Restaurant { id: string; name: string; cuisine: string; country: Country; menuItems: MenuItem[] }

const TILES = [
  { bg: 'bg-teal', fg: 'text-white', sub: 'text-white/75' },
  { bg: 'bg-saffron', fg: 'text-ink', sub: 'text-ink/70' },
  { bg: 'bg-ink', fg: 'text-white', sub: 'text-white/70' },
  { bg: 'bg-teal-soft', fg: 'text-teal-dark', sub: 'text-teal-dark/80' },
];

export default function Restaurants() {
  const { user, can } = useRequireAuth();
  const { data, loading: loadingList, error: loadError } = useQuery(RESTAURANTS, { skip: !user });
  const { data: cartData } = useQuery(CART, { skip: !user });
  const [change, { loading }] = useMutation(CHANGE_CART_ITEM, { refetchQueries: ['Cart'], awaitRefetchQueries: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!user) return null;
  const restaurants: Restaurant[] = data?.restaurants ?? [];
  const current = restaurants.find((r) => r.id === selected) ?? restaurants[0];
  const cart = cartData?.myCart;
  const qty = (id: string) => cart?.items.find((i: any) => i.menuItem.id === id)?.quantity ?? 0;
  const scope = user.role === 'ADMIN' ? 'both countries' : user.country === 'INDIA' ? 'India' : 'America';

  async function adjust(menuItemId: string, delta: number) {
    setError('');
    try { await change({ variables: { menuItemId, delta } }); } catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight">What's for lunch, {user.name.split(' ')[0]}?</h1>
        <p className="mt-1 text-sm text-ink/65">Showing restaurants in {scope}.</p>
        {loadError && <p role="alert" className="mt-2 text-sm text-danger">{loadError.message}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {loadingList && !restaurants.length && [0, 1].map((i) => <Skeleton key={i} className="h-24" />)}
          {restaurants.map((r, idx) => {
            const t = TILES[idx % TILES.length];
            const active = current?.id === r.id;
            return (
              <button key={r.id} onClick={() => setSelected(r.id)} aria-pressed={active}
                className={`${t.bg} ${t.fg} relative overflow-hidden rounded-lg p-4 text-left transition-transform ${active ? 'ring-4 ring-ink/25' : 'opacity-90 hover:opacity-100'}`}>
                <span aria-hidden className="absolute -right-2 -top-6 font-display text-8xl font-bold opacity-15">{r.name[0]}</span>
                <span className="block font-display text-xl font-bold">{r.name}</span>
                <span className={`block text-sm ${t.sub}`}>{r.cuisine}{user.role === 'ADMIN' && ` · ${r.country === 'INDIA' ? 'India' : 'America'}`}</span>
                <span className={`mt-3 block text-xs ${t.sub}`}>{r.menuItems.length} dishes</span>
              </button>
            );
          })}
        </div>

        {current && (
          <>
            <h2 className="mt-8 font-display text-xl font-bold">{current.name} menu</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {current.menuItems.map((m) => (
                <li key={m.id} className="panel flex flex-col !p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{m.name}</p>
                    <span className="shrink-0 rounded bg-saffron/30 px-2 py-0.5 text-sm font-medium">{money(m.price, current.country)}</span>
                  </div>
                  <p className="mt-1 flex-1 text-sm text-ink/60">{m.description}</p>
                  {can('createOrder') && (
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {qty(m.id) > 0 ? <>
                        <button className="btn-ghost h-8 w-8 !p-0" aria-label={`Remove one ${m.name}`} disabled={loading} onClick={() => adjust(m.id, -1)}>−</button>
                        <span className="w-6 text-center font-medium" aria-live="polite">{qty(m.id)}</span>
                        <button className="btn-primary h-8 w-8 !p-0" aria-label={`Add one more ${m.name}`} disabled={loading} onClick={() => adjust(m.id, 1)}>+</button>
                      </> : <button className="btn-primary" disabled={loading} onClick={() => adjust(m.id, 1)}>Add</button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <aside className="panel">
          <h2 className="font-display text-lg font-bold">Your cart</h2>
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          {!cart || cart.items.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Nothing here yet. Add dishes from a menu.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink/60">{cart.restaurant.name}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {cart.items.map((i: any) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span>{i.quantity} × {i.menuItem.name}</span>
                    <span>{money(i.quantity * i.unitPrice, cart.country)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-display text-lg font-bold"><span>Total</span><span>{money(cart.total, cart.country)}</span></p>
              {can('placeOrder')
                ? <Link href="/orders" className="btn-primary mt-4 w-full">Go to checkout</Link>
                : <p className="mt-4 rounded-md bg-saffron/20 p-3 text-sm">Members can't check out. A manager in your country can pay for this order from the Orders page.</p>}
            </>
          )}
        </aside>
        <AccessPanel />
      </div>
    </div>
  );
}
