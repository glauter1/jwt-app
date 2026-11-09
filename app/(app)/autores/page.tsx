'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/session';
import { mensagemErro } from '@/lib/erros';

type Autor = {
  id: number;
  name: string;
  nationality: string | null;
  birthDate: string | null;
};

const formatarData = (data: string | null) =>
  data ? data.split('-').reverse().join('/') : '-';

export default function AutoresPage() {
  const [autores, setAutores] = useState<Autor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/authors');
      setAutores(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar os autores'));
    }
  }, []);

  useEffect(() => {
    setIsAdmin(Boolean(getUser()?.isAdmin));
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setName('');
    setNationality('');
    setBirthDate('');
  }

  function iniciarEdicao(autor: Autor) {
    setErro(null);
    setAviso(null);
    setEditandoId(autor.id);
    setName(autor.name);
    setNationality(autor.nationality ?? '');
    setBirthDate(autor.birthDate ?? '');
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    if (!name.trim()) {
      setErro('Informe o nome do autor');
      return;
    }

    const dados = {
      name: name.trim(),
      nationality: nationality.trim(),
      birthDate: birthDate || null,
    };

    try {
      if (editandoId) {
        await api.put(`/authors/${editandoId}`, dados);
        setAviso('Autor atualizado');
      } else {
        await api.post('/authors', dados);
        setAviso('Autor cadastrado');
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível salvar o autor'));
    }
  }

  async function excluir(autor: Autor) {
    if (!window.confirm(`Excluir o autor "${autor.name}"?`)) return;

    setErro(null);
    setAviso(null);

    try {
      await api.delete(`/authors/${autor.id}`);
      setAviso('Autor excluído');
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível excluir o autor'));
    }
  }

  return (
    <div>
      <h1>Autores</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {aviso && <p style={{ color: 'green' }}>{aviso}</p>}

      {isAdmin && (
        <form onSubmit={salvar} style={{ display: 'grid', gap: 8, maxWidth: 400, margin: '16px 0' }}>
          <h2>{editandoId ? 'Editar autor' : 'Novo autor'}</h2>

          <label htmlFor="name">Nome</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="nationality">Nacionalidade</label>
          <input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />

          <label htmlFor="birthDate">Data de nascimento</label>
          <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar'}</button>
            {editandoId && (
              <button type="button" onClick={limparFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Nome</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Nacionalidade</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Nascimento</th>
            {isAdmin && <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {autores.map((autor) => (
            <tr key={autor.id}>
              <td style={{ padding: 8 }}>{autor.name}</td>
              <td style={{ padding: 8 }}>{autor.nationality || '-'}</td>
              <td style={{ padding: 8 }}>{formatarData(autor.birthDate)}</td>
              {isAdmin && (
                <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => iniciarEdicao(autor)}>Editar</button>
                  <button onClick={() => excluir(autor)}>Excluir</button>
                </td>
              )}
            </tr>
          ))}
          {autores.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 8 }}>
                Nenhum autor cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}