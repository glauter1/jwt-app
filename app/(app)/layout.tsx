import { ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Header />
      <main style={{ padding: 24 }}>{children}</main>
    </AuthGuard>
  );
}