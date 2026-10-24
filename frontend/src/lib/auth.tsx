'use client';
import { useApolloClient } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TOKEN_KEY } from './apollo';
import { LOGIN, ME } from './gql';
import { Action, POLICY, User } from './policy';

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (action: Action) => boolean;
}
const Ctx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) { setReady(true); return; }
    client.query({ query: ME, fetchPolicy: 'network-only' })
      .then((r) => setUser(r.data.me))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, [client]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await client.mutate({ mutation: LOGIN, variables: { email, password } });
    localStorage.setItem(TOKEN_KEY, data.login.accessToken);
    await client.clearStore(); // never show one user's cached data to the next
    setUser(data.login.user);
  }, [client]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    client.clearStore();
  }, [client]);

  const can = useCallback((a: Action) => !!user && (POLICY[a] as readonly string[]).includes(user.role), [user]);

  return <Ctx.Provider value={{ user, ready, login, logout, can }}>{children}</Ctx.Provider>;
}

/** Redirects to /login when signed out. Returns the auth state for the page to use. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => { if (auth.ready && !auth.user) router.replace('/login'); }, [auth.ready, auth.user, router]);
  return auth;
}
