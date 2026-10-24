'use client';
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { useRequireAuth } from '@/lib/auth';
import { CANCEL_ORDER, ORDERS, PAYMENT_METHODS, PLACE_ORDER } from '@/lib/gql';
import { money } from '@/lib/policy';

const STATUS: Record<string, string> = { DRAFT: 'bg-saffron/30', PLACED: 'bg-teal-soft text-teal-dark', CANCELLED: 'bg-ink/10 text-ink/60' };

function Steps({ status }: { status: string }) {
  const steps = status === 'CANCELLED' ? ['Draft', 'Cancelled'] : ['Draft', 'Placed'];
  const reached = status === 'DRAFT' ? 0 : 1;
  return (
    <ol className="mt-3 flex items-center gap-2 text-xs" aria-label="Order progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`grid h-5 w-5 place-items-center rounded-full ${i <= reached ? (status === 'CANCELLED' && i === 1 ? 'bg-danger text-white' : 'bg-teal text-white') : 'bg-ink/10'}`}>{i <= reached ? '✓' : ''}</span>
          <span className={i <= reached ? 'font-medium' : 'text-ink/50'}>{s}</span>
          {i < steps.length - 1 && <span aria-hidden className="h-px w-8 bg-ink/20" />}
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, methods, canPlace, canCancel }: { order: any; methods: any[]; canPlace: boolean; canCancel: boolean }) {
  const defaultId = methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? '';
  const [pm, setPm] = useState('');
  const [error, setError] = useState('');
  const [place, { loading: placing }] = useMutation(PLACE_ORDER);
  const [cancel, { loading: cancelling }] = useMutation(CANCEL_ORDER);
  const run = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); } catch (e) { setError((e as Error).message); } };

  return (
    <li className="panel">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-bold">{order.restaurant.name}</h2>
        <span className={`rounded px-2 py-0.5 text-xs ${STATUS[order.status]}`}>{order.status.toLowerCase()}</span>
        <span className="ml-auto text-sm text-ink/60">by {order.user.name} · {new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
      <Steps status={order.status} />
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((i: any) => (
          <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.menuItem.name}</span><span>{money(i.quantity * i.unitPrice, order.country)}</span></li>
        ))}
        {order.items.length === 0 && <li className="text-ink/60">No items</li>}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-3">
        <span className="font-medium">{money(order.total, order.country)}</span>
        {order.paymentMethod && <span className="text-sm text-ink/60">paid with {order.paymentMethod.label}</span>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canPlace && order.status === 'DRAFT' && order.items.length > 0 && <>
            <select aria-label="Payment method" className="input !w-auto" value={pm || defaultId} onChange={(e) => setPm(e.target.value)}>
              {methods.map((m) => <option key={m.id} value={m.id}>{m.label}{m.last4 && ` ····${m.last4}`}</option>)}
            </select>
            <button className="btn-primary" disabled={placing || !(pm || defaultId)}
              onClick={() => run(() => place({ variables: { orderId: order.id, paymentMethodId: pm || defaultId } }))}>
              Pay and place order
            </button>
          </>}
          {canCancel && order.status !== 'CANCELLED' && (
            <button className="btn-danger" disabled={cancelling} onClick={() => run(() => cancel({ variables: { orderId: order.id } }))}>Cancel order</button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </li>
  );
}

export default function Orders() {
  const { user, can } = useRequireAuth();
  const { data, error } = useQuery(ORDERS, { skip: !user });
  const { data: pmData } = useQuery(PAYMENT_METHODS, { skip: !user || !can('placeOrder') });
  if (!user) return null;
  const orders = data?.orders ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1>
      <p className="mb-4 text-sm text-ink/60">
        {user.role === 'ADMIN' ? 'All orders across both countries.' : user.role === 'MANAGER' ? `All orders in ${user.country === 'INDIA' ? 'India' : 'America'}.` : 'Your orders.'}
      </p>
      {error && <p role="alert" className="text-sm text-danger">{error.message}</p>}
      {orders.length === 0 && !error && <p className="text-sm text-ink/60">No orders yet. Add dishes from a restaurant to start one.</p>}
      <ul className="space-y-4">
        {orders.map((o: any) => (
          <OrderCard key={o.id} order={o} methods={pmData?.paymentMethods ?? []} canPlace={can('placeOrder')} canCancel={can('cancelOrder')} />
        ))}
      </ul>
    </div>
  );
}
