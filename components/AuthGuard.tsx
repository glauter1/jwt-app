'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getUser } from '@/lib/session';

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
};

export default function AuthGuard({ children, adminOnly = false }: Props) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    const user = getUser();

    if (!getAccessToken() || !user) {
      router.replace('/');
      return;
    }
    if (adminOnly && !user.isAdmin) {
      router.replace('/dashboard');
      return;
    }
    setLiberado(true);
  }, [router, adminOnly]);

  if (!liberado) return null;
  return <>{children}</>;
}