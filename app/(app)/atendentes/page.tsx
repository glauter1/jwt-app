'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { getUser } from '@/lib/session';
import { mensagemErro } from '@/lib/erros';

type Usuario = {
  id: number;
  name: string;
  username: string;
  email: string;
  isAdmin: boolean;
  active: boolean;
};

export default function AtendentesPage() {
  return (
    <AuthGuard adminOnly>
      <Atendentes />
    </AuthGuard>
  );
}

function Atendentes() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meuId, setMeuId] = useState<number | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/user');
      setUsuarios(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar os atendentes'));
    }
  }, []);

  useEffect(() => {
    setMeuId(getUser()?.id ?? null);
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
  }

  function iniciarEdicao(usuario: Usuario) {
    setErro(null);
    setAviso(null);
    setEditandoId(usuario.id);
    setName(usuario.name);
    setUsername(usuario.username);
    setEmail(usuario.email);
    setPassword('');
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    if (!name.trim()) return setErro('Informe o nome');
    if (!username.trim()) return setErro('Informe o nome de usuário');
    if (!email.includes('@')) return setErro('Informe um e-mail válido');
    if (!editandoId && password.length < 6) {
      return setErro('A senha deve ter pelo menos 6 caracteres');
    }
    if (editandoId && password && password.length < 6) {
      return setErro('A nova senha deve ter pelo menos 6 caracteres');
    }

    const dados: Record<string, string | boolean> = {
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
    };
    if (password) dados.password = password;

    try {
      if (editandoId) {
        await api.put(`/user/${editandoId}`, dados);
        setAviso('Atendente atualizado');
      } else {
        await api.post('/user', { ...dados, isAdmin: false });
        setAviso('Atendente cadastrado');
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível salvar o atendente'));
    }
  }

  async function alternarAtivo(usuario: Usuario) {
    const acao = usuario.active ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja ${acao} "${usuario.name}"?`)) return;

    setErro(null);
    setAviso(null);

    try {
      await api.patch(`/user/${usuario.id}/active`, { active: !usuario.active });
      setAviso(usuario.active ? 'Atendente desativado' : 'Atendente ativado');
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível alterar a situação'));
    }
  }

  const celula = { padding: 8 };
  const cabecalho = { textAlign: 'left' as const, borderBottom: '1px solid #ccc', padding: 8 };

  return (
    <div>
      <h1>Atendentes</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {aviso && <p style={{ color: 'green' }}>{aviso}</p>}

      <form onSubmit={salvar} style={{ display: 'grid', gap: 8, maxWidth: 400, margin: '16px 0' }}>
        <h2>{editandoId ? 'Editar atendente' : 'Novo atendente'}</h2>

        <label htmlFor="name">Nome</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="username">Usuário</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">{editandoId ? 'Nova senha (deixe vazio para manter)' : 'Senha'}</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar'}</button>
          {editandoId && (
            <button type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cabecalho}>Nome</th>
            <th style={cabecalho}>Usuário</th>
            <th style={cabecalho}>E-mail</th>
            <th style={cabecalho}>Perfil</th>
            <th style={cabecalho}>Situação</th>
            <th style={cabecalho}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td style={celula}>{usuario.name}</td>
              <td style={celula}>{usuario.username}</td>
              <td style={celula}>{usuario.email}</td>
              <td style={celula}>{usuario.isAdmin ? 'Administrador' : 'Atendente'}</td>
              <td style={{ ...celula, color: usuario.active ? 'green' : 'red' }}>
                {usuario.active ? 'Ativo' : 'Desativado'}
              </td>
              <td style={{ ...celula, display: 'flex', gap: 8 }}>
                <button onClick={() => iniciarEdicao(usuario)}>Editar</button>
                {usuario.id !== meuId && (
                  <button onClick={() => alternarAtivo(usuario)}>
                    {usuario.active ? 'Desativar' : 'Ativar'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={6} style={celula}>
                Nenhum usuário encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}