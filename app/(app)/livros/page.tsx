'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/session';
import { mensagemErro } from '@/lib/erros';

type Categoria = { id: number; name: string };
type Autor = { id: number; name: string };

type Livro = {
  id: number;
  title: string;
  isbn: string;
  year: number | null;
  totalCopies: number;
  availableCopies: number;
  categoryId: number | null;
  Category?: Categoria | null;
  Authors?: Autor[];
};

type Filtros = {
  title: string;
  categoryId: string;
  authorId: string;
  available: boolean;
};

const FILTROS_VAZIOS: Filtros = { title: '', categoryId: '', authorId: '', available: false };

export default function LivrosPage() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [autores, setAutores] = useState<Autor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [year, setYear] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [authorIds, setAuthorIds] = useState<number[]>([]);

  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregarLivros = useCallback(async (f: Filtros) => {
    try {
      const params: Record<string, string> = {};
      if (f.title.trim()) params.title = f.title.trim();
      if (f.categoryId) params.categoryId = f.categoryId;
      if (f.authorId) params.authorId = f.authorId;
      if (f.available) params.available = 'true';

      const res = await api.get('/books', { params });
      setLivros(res.data);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível carregar os livros'));
    }
  }, []);

  useEffect(() => {
    setIsAdmin(Boolean(getUser()?.isAdmin));
    carregarLivros(FILTROS_VAZIOS);

    api
      .get('/categories')
      .then((res) => setCategorias(res.data))
      .catch(() => setErro('Não foi possível carregar as categorias'));

    api
      .get('/authors')
      .then((res) => setAutores(res.data))
      .catch(() => setErro('Não foi possível carregar os autores'));
  }, [carregarLivros]);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    carregarLivros(filtros);
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
    carregarLivros(FILTROS_VAZIOS);
  }

  function limparFormulario() {
    setEditandoId(null);
    setTitle('');
    setIsbn('');
    setYear('');
    setTotalCopies('1');
    setCategoryId('');
    setAuthorIds([]);
  }

  function alternarAutor(id: number) {
    setAuthorIds((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]
    );
  }

  async function iniciarEdicao(livro: Livro) {
    setErro(null);
    setAviso(null);
    try {
      const res = await api.get(`/books/${livro.id}`);
      const completo: Livro = res.data;

      setEditandoId(completo.id);
      setTitle(completo.title);
      setIsbn(completo.isbn);
      setYear(completo.year ? String(completo.year) : '');
      setTotalCopies(String(completo.totalCopies));
      setCategoryId(completo.categoryId ? String(completo.categoryId) : '');
      setAuthorIds((completo.Authors ?? []).map((autor) => autor.id));
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível abrir o livro para edição'));
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    const total = Number(totalCopies);

    if (!title.trim()) return setErro('Informe o título');
    if (!isbn.trim()) return setErro('Informe o ISBN');
    if (!categoryId) return setErro('Escolha a categoria');
    if (authorIds.length === 0) return setErro('Escolha pelo menos um autor');
    if (!Number.isInteger(total) || total < 1) {
      return setErro('Informe a quantidade de exemplares (mínimo 1)');
    }

    const dados = {
      title: title.trim(),
      isbn: isbn.trim(),
      year: year ? Number(year) : null,
      totalCopies: total,
      categoryId: Number(categoryId),
      authorIds,
    };

    try {
      if (editandoId) {
        await api.put(`/books/${editandoId}`, dados);
        setAviso('Livro atualizado');
      } else {
        await api.post('/books', dados);
        setAviso('Livro cadastrado');
      }
      limparFormulario();
      await carregarLivros(filtros);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível salvar o livro'));
    }
  }

  async function excluir(livro: Livro) {
    if (!window.confirm(`Excluir o livro "${livro.title}"?`)) return;

    setErro(null);
    setAviso(null);

    try {
      await api.delete(`/books/${livro.id}`);
      setAviso('Livro excluído');
      await carregarLivros(filtros);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível excluir o livro'));
    }
  }

  const celula = { padding: 8 };
  const cabecalho = { textAlign: 'left' as const, borderBottom: '1px solid #ccc', padding: 8 };

  return (
    <div>
      <h1>Livros</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {aviso && <p style={{ color: 'green' }}>{aviso}</p>}

      {isAdmin && (
        <form onSubmit={salvar} style={{ display: 'grid', gap: 8, maxWidth: 480, margin: '16px 0' }}>
          <h2>{editandoId ? 'Editar livro' : 'Novo livro'}</h2>

          <label htmlFor="title">Título</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label htmlFor="isbn">ISBN</label>
          <input id="isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} />

          <label htmlFor="year">Ano</label>
          <input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />

          <label htmlFor="totalCopies">Exemplares (total)</label>
          <input
            id="totalCopies"
            type="number"
            min={1}
            value={totalCopies}
            onChange={(e) => setTotalCopies(e.target.value)}
          />

          <label htmlFor="categoryId">Categoria</label>
          <select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Selecione...</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.name}
              </option>
            ))}
          </select>

          <fieldset>
            <legend>Autores</legend>
            {autores.length === 0 && <p>Cadastre um autor antes de cadastrar livros.</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {autores.map((autor) => (
                <label key={autor.id} style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={authorIds.includes(autor.id)}
                    onChange={() => alternarAutor(autor.id)}
                  />
                  {autor.name}
                </label>
              ))}
            </div>
          </fieldset>

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

      <form onSubmit={buscar} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        <input
          placeholder="Buscar por título"
          value={filtros.title}
          onChange={(e) => setFiltros({ ...filtros, title: e.target.value })}
        />

        <select
          value={filtros.categoryId}
          onChange={(e) => setFiltros({ ...filtros, categoryId: e.target.value })}
        >
          <option value="">Todas as categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.name}
            </option>
          ))}
        </select>

        <select
          value={filtros.authorId}
          onChange={(e) => setFiltros({ ...filtros, authorId: e.target.value })}
        >
          <option value="">Todos os autores</option>
          {autores.map((autor) => (
            <option key={autor.id} value={autor.id}>
              {autor.name}
            </option>
          ))}
        </select>

        <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={filtros.available}
            onChange={(e) => setFiltros({ ...filtros, available: e.target.checked })}
          />
          Só disponíveis
        </label>

        <button type="submit">Buscar</button>
        <button type="button" onClick={limparFiltros}>
          Limpar
        </button>
      </form>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cabecalho}>Título</th>
            <th style={cabecalho}>Autores</th>
            <th style={cabecalho}>Categoria</th>
            <th style={cabecalho}>ISBN</th>
            <th style={cabecalho}>Ano</th>
            <th style={cabecalho}>Disponíveis</th>
            {isAdmin && <th style={cabecalho}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {livros.map((livro) => (
            <tr key={livro.id}>
              <td style={celula}>{livro.title}</td>
              <td style={celula}>{(livro.Authors ?? []).map((autor) => autor.name).join(', ') || '-'}</td>
              <td style={celula}>{livro.Category?.name ?? '-'}</td>
              <td style={celula}>{livro.isbn}</td>
              <td style={celula}>{livro.year ?? '-'}</td>
              <td style={{ ...celula, color: livro.availableCopies === 0 ? 'red' : 'inherit' }}>
                {livro.availableCopies} de {livro.totalCopies}
              </td>
              {isAdmin && (
                <td style={{ ...celula, display: 'flex', gap: 8 }}>
                  <button onClick={() => iniciarEdicao(livro)}>Editar</button>
                  <button onClick={() => excluir(livro)}>Excluir</button>
                </td>
              )}
            </tr>
          ))}
          {livros.length === 0 && (
            <tr>
              <td colSpan={7} style={celula}>
                Nenhum livro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}