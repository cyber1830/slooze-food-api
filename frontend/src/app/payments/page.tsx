'use client';
import { useMutation, useQuery } from '@apollo/client';
import { FormEvent, useState } from 'react';
import { useRequireAuth } from '@/lib/auth';
import { ADD_PAYMENT_METHOD, PAYMENT_METHODS, UPDATE_PAYMENT_METHOD } from '@/lib/gql';

export default function Payments() {
  const { user, can } = useRequireAuth();
  const { data, error: loadError } = useQuery(PAYMENT_METHODS, { skip: !user || !can('viewPayments') });
  const [add] = useMutation(ADD_PAYMENT_METHOD, { refetchQueries: ['PaymentMethods'], awaitRefetchQueries: true });
  const [update] = useMutation(UPDATE_PAYMENT_METHOD, { refetchQueries: ['PaymentMethods'], awaitRefetchQueries: true });
  const [form, setForm] = useState({ type: 'CARD', label: '', last4: '' });
  const [error, setError] = useState('');
  if (!user) return null;
  if (!can('viewPayments')) return <p className="text-sm">Members don't have access to payment methods.</p>;
  const admin = can('managePayments');
  const guard = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); } catch (e) { setError((e as Error).message); } };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    guard(async () => { await add({ variables: { input: { ...form, last4: form.last4 || null } } }); setForm({ type: 'CARD', label: '', last4: '' }); });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Payment methods</h1>
      <p className="mb-4 text-sm text-ink/60">{admin ? 'Shared by the whole company. Orders are paid with one of these.' : 'Read only. Only the admin can change these.'}</p>
      {(error || loadError) && <p role="alert" className="mb-2 text-sm text-danger">{error || loadError?.message}</p>}
      <ul className="divide-y divide-ink/10 rounded-lg bg-white ring-1 ring-ink/10">
        {(data?.paymentMethods ?? []).map((m: any) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium">{m.label}{m.last4 && <span className="ml-2 text-ink/60">····{m.last4}</span>}</p>
              <p className="text-xs text-ink/60">{m.type}</p>
            </div>
            {m.isDefault && <span className="rounded bg-teal-soft px-2 py-0.5 text-xs text-teal-dark">default</span>}
            {admin && <>
              {!m.isDefault && <button className="btn-ghost" onClick={() => guard(() => update({ variables: { id: m.id, input: { isDefault: true } } }))}>Make default</button>}
              <button className="btn-ghost" onClick={() => {
                const label = window.prompt('New name for this payment method', m.label);
                if (label) guard(() => update({ variables: { id: m.id, input: { label } } }));
              }}>Rename</button>
            </>}
          </li>
        ))}
      </ul>

      {admin && (
        <form onSubmit={submit} className="panel mt-6 grid gap-3 sm:grid-cols-[120px_1fr_100px_auto]">
          <select aria-label="Type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>CARD</option><option>UPI</option><option>PAYPAL</option>
          </select>
          <input aria-label="Name" className="input" placeholder="Name, e.g. Team Amex" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input aria-label="Last 4 digits" className="input" placeholder="Last 4" maxLength={4} value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value })} />
          <button className="btn-primary">Add method</button>
        </form>
      )}
    </div>
  );
}
