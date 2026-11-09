'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/session';
import { mensagemErro } from '@/lib/erros';

type Categoria = {
  id: number;
  name: string;
  description: string | null;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategorias(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar as categorias'));
    }
  }, []);

  useEffect(() => {
    setIsAdmin(Boolean(getUser()?.isAdmin));
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setName('');
    setDescription('');
  }

  function iniciarEdicao(categoria: Categoria) {
    setErro(null);
    setAviso(null);
    setEditandoId(categoria.id);
    setName(categoria.name);
    setDescription(categoria.description ?? '');
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    if (!name.trim()) {
      setErro('Informe o nome da categoria');
      return;
    }

    const dados = { name: name.trim(), description: description.trim() };

    try {
      if (editandoId) {
        await api.put(`/categories/${editandoId}`, dados);
        setAviso('Categoria atualizada');
      } else {
        await api.post('/categories', dados);
        setAviso('Categoria cadastrada');
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível salvar a categoria'));
    }
  }

  async function excluir(categoria: Categoria) {
    if (!window.confirm(`Excluir a categoria "${categoria.name}"?`)) return;

    setErro(null);
    setAviso(null);

    try {
      await api.delete(`/categories/${categoria.id}`);
      setAviso('Categoria excluída');
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível excluir a categoria'));
    }
  }

  return (
    <div>
      <h1>Categorias</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {aviso && <p style={{ color: 'green' }}>{aviso}</p>}

      {isAdmin && (
        <form onSubmit={salvar} style={{ display: 'grid', gap: 8, maxWidth: 400, margin: '16px 0' }}>
          <h2>{editandoId ? 'Editar categoria' : 'Nova categoria'}</h2>

          <label htmlFor="name">Nome</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="description">Descrição</label>
          <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />

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
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Descrição</th>
            {isAdmin && <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {categorias.map((categoria) => (
            <tr key={categoria.id}>
              <td style={{ padding: 8 }}>{categoria.name}</td>
              <td style={{ padding: 8 }}>{categoria.description || '-'}</td>
              {isAdmin && (
                <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => iniciarEdicao(categoria)}>Editar</button>
                  <button onClick={() => excluir(categoria)}>Excluir</button>
                </td>
              )}
            </tr>
          ))}
          {categorias.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 8 }}>
                Nenhuma categoria cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}