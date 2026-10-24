'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth';

const DEMO = [
  ['Nick Fury', 'nick.fury@slooze.xyz', 'Admin'],
  ['Captain Marvel', 'captain.marvel@slooze.xyz', 'Manager · India'],
  ['Captain America', 'captain.america@slooze.xyz', 'Manager · America'],
  ['Thanos', 'thanos@slooze.xyz', 'Member · India'],
  ['Thor', 'thor@slooze.xyz', 'Member · India'],
  ['Travis', 'travis@slooze.xyz', 'Member · America'],
];

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); router.replace('/'); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      <form onSubmit={submit} className="panel space-y-4">
        <h1 className="font-display text-2xl font-bold">Sign in</h1>
        <label className="block text-sm">Email
          <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">Password
          <input className="input mt-1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="panel">
        <h2 className="font-display text-lg font-bold">Demo accounts</h2>
        <p className="mb-3 text-sm text-ink/70">Every account uses password123. Pick one to fill the form.</p>
        <ul className="space-y-1">
          {DEMO.map(([name, mail, label]) => (
            <li key={mail}>
              <button type="button" onClick={() => setEmail(mail)} className="flex w-full justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-teal-soft">
                <span>{name}</span><span className="text-ink/60">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
