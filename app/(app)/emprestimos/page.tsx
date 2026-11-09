'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { mensagemErro } from '@/lib/erros';

type Leitor = { id: number; name: string; cpf: string };
type LivroOpcao = { id: number; title: string; availableCopies: number };

type Status = '' | 'ATIVO' | 'ATRASADO' | 'DEVOLVIDO';

type Emprestimo = {
  id: number;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'ATIVO' | 'ATRASADO' | 'DEVOLVIDO';
  fine: number;
  Book?: { id: number; title: string } | null;
  Reader?: { id: number; name: string } | null;
  User?: { id: number; name: string } | null;
};

type Aviso = { texto: string; cor: string };

const formatarData = (data: string | null) =>
  data ? data.split('-').reverse().join('/') : '-';

const dinheiro = (valor: number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const corDoStatus = (status: Emprestimo['status']) =>
  status === 'ATRASADO' ? 'red' : status === 'DEVOLVIDO' ? 'gray' : 'inherit';

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [leitores, setLeitores] = useState<Leitor[]>([]);
  const [livros, setLivros] = useState<LivroOpcao[]>([]);

  const [filtroStatus, setFiltroStatus] = useState<Status>('');
  const [buscaLeitor, setBuscaLeitor] = useState('');
  const [buscaLivro, setBuscaLivro] = useState('');
  const [readerId, setReaderId] = useState('');
  const [bookId, setBookId] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const carregarEmprestimos = useCallback(async (status: Status) => {
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;

      const res = await api.get('/loans', { params });
      setEmprestimos(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar os empréstimos'));
    }
  }, []);

  const carregarLivros = useCallback(async () => {
    try {
      const res = await api.get('/books', { params: { available: 'true' } });
      setLivros(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar os livros'));
    }
  }, []);

  useEffect(() => {
    carregarEmprestimos('');
    carregarLivros();

    api
      .get('/readers')
      .then((res) => setLeitores(res.data))
      .catch((err) => setErro(mensagemErro(err, 'Não foi possível carregar os leitores')));
  }, [carregarEmprestimos, carregarLivros]);

  function mudarFiltro(novo: Status) {
    setFiltroStatus(novo);
    carregarEmprestimos(novo);
  }

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    if (!readerId) return setErro('Escolha o leitor');
    if (!bookId) return setErro('Escolha o livro');

    setEnviando(true);
    try {
      await api.post('/loans', { bookId: Number(bookId), readerId: Number(readerId) });
      setAviso({ texto: 'Empréstimo registrado', cor: 'green' });
      setBookId('');
      await Promise.all([carregarEmprestimos(filtroStatus), carregarLivros()]);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível registrar o empréstimo'));
    } finally {
      setEnviando(false);
    }
  }

  async function devolver(emprestimo: Emprestimo) {
    const titulo = emprestimo.Book?.title ?? 'este livro';
    if (!window.confirm(`Registrar a devolução de "${titulo}"?`)) return;

    setErro(null);
    setAviso(null);

    try {
      const res = await api.patch(`/loans/${emprestimo.id}/return`);
      const multa = Number(res.data.fine);

      if (multa > 0) {
        setAviso({ texto: `Devolução registrada com atraso. Multa: ${dinheiro(multa)}`, cor: 'red' });
      } else {
        setAviso({ texto: 'Devolução registrada. Sem multa.', cor: 'green' });
      }
      await Promise.all([carregarEmprestimos(filtroStatus), carregarLivros()]);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível registrar a devolução'));
    }
  }

  const termoLeitor = buscaLeitor.trim().toLowerCase();
  const termoCpf = buscaLeitor.replace(/\D/g, '');
  const leitoresFiltrados = leitores.filter(
    (leitor) =>
      leitor.name.toLowerCase().includes(termoLeitor) ||
      (termoCpf !== '' && leitor.cpf.includes(termoCpf))
  );

  const termoLivro = buscaLivro.trim().toLowerCase();
  const livrosFiltrados = livros.filter((livro) => livro.title.toLowerCase().includes(termoLivro));

  const celula = { padding: 8 };
  const cabecalho = { textAlign: 'left' as const, borderBottom: '1px solid #ccc', padding: 8 };

  return (
    <div>
      <h1>Empréstimos</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {aviso && <p style={{ color: aviso.cor, fontWeight: 'bold' }}>{aviso.texto}</p>}

      <form onSubmit={registrar} style={{ display: 'grid', gap: 8, maxWidth: 480, margin: '16px 0' }}>
        <h2>Novo empréstimo</h2>

        <label htmlFor="buscaLeitor">Leitor</label>
        <input
          id="buscaLeitor"
          placeholder="Buscar leitor por nome ou CPF"
          value={buscaLeitor}
          onChange={(e) => setBuscaLeitor(e.target.value)}
        />
        <select value={readerId} onChange={(e) => setReaderId(e.target.value)}>
          <option value="">Selecione o leitor...</option>
          {leitoresFiltrados.map((leitor) => (
            <option key={leitor.id} value={leitor.id}>
              {leitor.name}
            </option>
          ))}
        </select>

        <label htmlFor="buscaLivro">Livro (só os disponíveis)</label>
        <input
          id="buscaLivro"
          placeholder="Buscar livro por título"
          value={buscaLivro}
          onChange={(e) => setBuscaLivro(e.target.value)}
        />
        <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">Selecione o livro...</option>
          {livrosFiltrados.map((livro) => (
            <option key={livro.id} value={livro.id}>
              {livro.title} ({livro.availableCopies} disponível)
            </option>
          ))}
        </select>

        <button type="submit" disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar empréstimo'}
        </button>
      </form>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0' }}>
        <label htmlFor="filtroStatus">Filtrar por situação:</label>
        <select
          id="filtroStatus"
          value={filtroStatus}
          onChange={(e) => mudarFiltro(e.target.value as Status)}
        >
          <option value="">Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="ATRASADO">Atrasados</option>
          <option value="DEVOLVIDO">Devolvidos</option>
        </select>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cabecalho}>Livro</th>
            <th style={cabecalho}>Leitor</th>
            <th style={cabecalho}>Atendente</th>
            <th style={cabecalho}>Empréstimo</th>
            <th style={cabecalho}>Prazo</th>
            <th style={cabecalho}>Devolução</th>
            <th style={cabecalho}>Situação</th>
            <th style={cabecalho}>Multa</th>
            <th style={cabecalho}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {emprestimos.map((emprestimo) => (
            <tr key={emprestimo.id}>
              <td style={celula}>{emprestimo.Book?.title ?? '(livro removido)'}</td>
              <td style={celula}>{emprestimo.Reader?.name ?? '-'}</td>
              <td style={celula}>{emprestimo.User?.name ?? '-'}</td>
              <td style={celula}>{formatarData(emprestimo.loanDate)}</td>
              <td style={celula}>{formatarData(emprestimo.dueDate)}</td>
              <td style={celula}>{formatarData(emprestimo.returnDate)}</td>
              <td style={{ ...celula, color: corDoStatus(emprestimo.status), fontWeight: 'bold' }}>
                {emprestimo.status}
              </td>
              <td style={celula}>{dinheiro(emprestimo.fine)}</td>
              <td style={celula}>
                {!emprestimo.returnDate && (
                  <button onClick={() => devolver(emprestimo)}>Devolver</button>
                )}
              </td>
            </tr>
          ))}
          {emprestimos.length === 0 && (
            <tr>
              <td colSpan={9} style={celula}>
                Nenhum empréstimo encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}