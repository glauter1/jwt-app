'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/session';

type Resumo = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
};

const dinheiro = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [nome, setNome] = useState('');
  const [semPermissao, setSemPermissao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setNome(getUser()?.name ?? '');

    api
      .get('/reports/dashboard')
      .then((res) => setResumo(res.data))
      .catch((err) => {
        if (err.response?.status === 403) setSemPermissao(true);
        else setErro('Não foi possível carregar o resumo');
      });
  }, []);

  const cards = resumo
    ? [
        { titulo: 'Livros cadastrados', valor: String(resumo.totalBooks) },
        { titulo: 'Empréstimos ativos', valor: String(resumo.activeLoans) },
        { titulo: 'Empréstimos atrasados', valor: String(resumo.overdueLoans) },
        { titulo: 'Multas arrecadadas', valor: dinheiro(resumo.totalFines) },
      ]
    : [];

  return (
    <div>
      <h1>Olá, {nome}</h1>

      {semPermissao && <p>Os números do resumo são visíveis apenas para administradores.</p>}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((card) => (
          <div key={card.titulo} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
            <p>{card.titulo}</p>
            <strong style={{ fontSize: 28 }}>{card.valor}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}