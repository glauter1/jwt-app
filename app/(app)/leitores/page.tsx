'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { mensagemErro } from '@/lib/erros';

type Leitor = {
  id: number;
  name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
};

type Emprestimo = {
  id: number;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'ATIVO' | 'ATRASADO' | 'DEVOLVIDO';
  fine: number;
  Book?: { title: string } | null;
};

const formatarData = (data: string | null) =>
  data ? data.split('-').reverse().join('/') : '-';

const formatarCpf = (cpf: string) =>
  cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;

const dinheiro = (valor: number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const corDoStatus = (status: Emprestimo['status']) =>
  status === 'ATRASADO' ? 'red' : status === 'DEVOLVIDO' ? 'gray' : 'inherit';

export default function LeitoresPage() {
  const [leitores, setLeitores] = useState<Leitor[]>([]);
  const [busca, setBusca] = useState('');

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [leitorHistorico, setLeitorHistorico] = useState<Leitor | null>(null);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/readers');
      setLeitores(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar os leitores'));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
  }

  function iniciarEdicao(leitor: Leitor) {
    setErro(null);
    setAviso(null);
    setEditandoId(leitor.id);
    setName(leitor.name);
    setCpf(leitor.cpf);
    setEmail(leitor.email ?? '');
    setPhone(leitor.phone ?? '');
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    const cpfSomenteNumeros = cpf.replace(/\D/g, '');

    if (!name.trim()) return setErro('Informe o nome do leitor');
    if (cpfSomenteNumeros.length !== 11) return setErro('O CPF deve ter 11 números');
    if (!email.includes('@')) return setErro('Informe um e-mail válido');

    const dados = {
      name: name.trim(),
      cpf: cpfSomenteNumeros,
      email: email.trim(),
      phone: phone.trim(),
    };

    try {
      if (editandoId) {
        await api.put(`/readers/${editandoId}`, dados);
        setAviso('Leitor atualizado');
      } else {
        await api.post('/readers', dados);
        setAviso('Leitor cadastrado');
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível salvar o leitor'));
    }
  }

  async function verHistorico(leitor: Leitor) {
    setErro(null);
    setLeitorHistorico(leitor);
    setEmprestimos([]);

    try {
      const res = await api.get(`/readers/${leitor.id}/loans`);
      setEmprestimos(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar o histórico'));
    }
  }

  const termo = busca.trim().toLowerCase();
  const leitoresFiltrados = leitores.filter(
    (leitor) =>
      leitor.name.toLowerCase().includes(termo) || leitor.cpf.includes(termo.replace(/\D/g, '') || '§')
  );

  const celula = { padding: 8 };
  const cabecalho = { textAlign: 'left' as const, borderBottom: '1px solid #ccc', padding: 8 };

  return (
    <div>
      <h1>Leitores</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {aviso && <p style={{ color: 'green' }}>{aviso}</p>}

      <form onSubmit={salvar} style={{ display: 'grid', gap: 8, maxWidth: 400, margin: '16px 0' }}>
        <h2>{editandoId ? 'Editar leitor' : 'Novo leitor'}</h2>

        <label htmlFor="name">Nome</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="cpf">CPF (só números)</label>
        <input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="phone">Telefone</label>
        <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar'}</button>
          {editandoId && (
            <button type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <input
        placeholder="Buscar por nome ou CPF"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ margin: '8px 0', minWidth: 280 }}
      />

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cabecalho}>Nome</th>
            <th style={cabecalho}>CPF</th>
            <th style={cabecalho}>E-mail</th>
            <th style={cabecalho}>Telefone</th>
            <th style={cabecalho}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {leitoresFiltrados.map((leitor) => (
            <tr key={leitor.id}>
              <td style={celula}>{leitor.name}</td>
              <td style={celula}>{formatarCpf(leitor.cpf)}</td>
              <td style={celula}>{leitor.email || '-'}</td>
              <td style={celula}>{leitor.phone || '-'}</td>
              <td style={{ ...celula, display: 'flex', gap: 8 }}>
                <button onClick={() => iniciarEdicao(leitor)}>Editar</button>
                <button onClick={() => verHistorico(leitor)}>Histórico</button>
              </td>
            </tr>
          ))}
          {leitoresFiltrados.length === 0 && (
            <tr>
              <td colSpan={5} style={celula}>
                Nenhum leitor encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {leitorHistorico && (
        <section style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <h2>Histórico de {leitorHistorico.name}</h2>
            <button onClick={() => setLeitorHistorico(null)}>Fechar</button>
          </div>

          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={cabecalho}>Livro</th>
                <th style={cabecalho}>Empréstimo</th>
                <th style={cabecalho}>Prazo</th>
                <th style={cabecalho}>Devolução</th>
                <th style={cabecalho}>Status</th>
                <th style={cabecalho}>Multa</th>
              </tr>
            </thead>
            <tbody>
              {emprestimos.map((emprestimo) => (
                <tr key={emprestimo.id}>
                  <td style={celula}>{emprestimo.Book?.title ?? '(livro removido)'}</td>
                  <td style={celula}>{formatarData(emprestimo.loanDate)}</td>
                  <td style={celula}>{formatarData(emprestimo.dueDate)}</td>
                  <td style={celula}>{formatarData(emprestimo.returnDate)}</td>
                  <td style={{ ...celula, color: corDoStatus(emprestimo.status) }}>{emprestimo.status}</td>
                  <td style={celula}>{dinheiro(emprestimo.fine)}</td>
                </tr>
              ))}
              {emprestimos.length === 0 && (
                <tr>
                  <td colSpan={6} style={celula}>
                    Este leitor ainda não tem empréstimos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}