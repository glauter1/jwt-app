'use client';

import axios from 'axios';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { getAccessToken, saveSession } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken()) router.replace('/dashboard');
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Informe um e-mail válido');
      return;
    }
    if (!password) {
      setError('Informe a senha');
      return;
    }

    setLoading(true);
    try {
      const res = await publicApi.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data;
      saveSession(accessToken, refreshToken, user);
      router.replace('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Não foi possível conectar à API');
      } else {
        setError('Erro inesperado ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: '80px auto' }}>
      <h1>Biblioteca</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Senha</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button disabled={loading} type="submit">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </main>
  );
}