import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/lib/apollo';
import { AuthProvider } from '@/lib/auth';
import Nav from '@/components/Nav';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = { title: 'Urban Eats', description: 'Team food ordering with role- and country-based access' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
