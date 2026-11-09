'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { clearSession, getRefreshToken, getUser, SessionUser } from '@/lib/session';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  async function sair() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await publicApi.post('/auth/logout', { refreshToken });
      }
    } finally {
      clearSession();
      router.replace('/');
    }
  }

  return (
    <header style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, borderBottom: '1px solid #ccc' }}>
      <nav style={{ display: 'flex', gap: 12, flex: 1 }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/categorias">Categorias</Link>
        <Link href="/autores">Autores</Link>
        <Link href="/livros">Livros</Link>
        <Link href="/leitores">Leitores</Link>
        <Link href="/emprestimos">Empréstimos</Link>
        {user?.isAdmin && <Link href="/atendentes">Atendentes</Link>}
      </nav>
      <span>{user?.name}</span>
      <button onClick={sair}>Sair</button>
    </header>
  );
}