# Biblioteca App (jwt-app)

Front-end do sistema de gestão de biblioteca. Consome a API do projeto `jwt-api`. Trabalho da disciplina de front-end, ads, Unipar.

**Integrantes:** Glauter Junior Alberico RA:60006591

## Tecnologias

- Next.js 16 (App Router), React 19 e TypeScript
- Axios, com interceptor para renovar o token sozinho

## Como instalar e rodar

A API (`jwt-api`) precisa estar rodando em `http://localhost:3000`.

```bash
git clone [link do seu fork do jwt-app]
cd jwt-app
npm install
npm run dev
```

O front abre em `http://localhost:3001`. A porta 3001 está no script `dev` do `package.json`, porque a 3000 é da API. A API libera o CORS para esse endereço.

## Variáveis de ambiente

| Variável | Para que serve | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Endereço da API | `http://localhost:3000/v1` |

Sem a variável, o front usa o padrão. O arquivo `.env.example` mostra o formato.

## Acesso

Entre com o administrador criado pelo seed da API (veja o README do `jwt-api`). O administrador cadastra os atendentes na tela **Atendentes**.

## Telas

| Tela | Quem acessa | O que faz |
|---|---|---|
| Login | Todos | Valida os campos e mostra a mensagem de erro da API |
| Dashboard | Todos entram; os números são só do administrador | Cards com livros, empréstimos ativos, atrasados e multas |
| Categorias e Autores | Todos veem; só o administrador altera | Listagem, cadastro, edição e exclusão |
| Livros | Todos veem; só o administrador altera | Busca com filtros (título, categoria, autor, só disponíveis), cadastro com categoria e vários autores, exemplares disponíveis |
| Leitores | Todos | Cadastro, edição, busca e histórico de empréstimos |
| Empréstimos | Todos | Novo empréstimo (busca de leitor e livro), filtro por situação e devolução mostrando a multa |
| Atendentes | Só o administrador | Cadastro, edição e ativar ou desativar |

O nome do usuário e o botão **Sair** ficam no topo. O menu **Atendentes** só aparece para o administrador.

## Como a sessão funciona

- Depois do login, o front guarda no `localStorage` o `accessToken`, o `refreshToken` e os dados do usuário (`lib/session.ts`).
- Todas as telas internas usam um cliente Axios (`lib/api.ts`) que coloca o access token em cada requisição.
- O login e a renovação usam outro cliente, sem interceptor, para não entrar num laço.
- Quando a API responde **401**, o interceptor chama `/auth/refresh` **uma única vez** e repete a requisição original com o token novo.
- Se várias requisições recebem 401 ao mesmo tempo, sai **uma** chamada de refresh e as outras esperam o resultado (fila).
- Se o refresh falhar, a sessão é apagada e o usuário volta para a tela de login.
- O componente `AuthGuard` protege as telas: sem sessão, redireciona para o login. Na tela de atendentes ele também barra quem não é administrador.
- O botão **Sair** avisa a API, que revoga o refresh token, e apaga a sessão.

## Onde guardamos os tokens e os riscos

Escolhemos o `localStorage`. É simples e funciona com o interceptor, mas tem riscos:

- Qualquer script que rode na página consegue ler o armazenamento. Se o site tiver uma falha de XSS, os tokens podem ser roubados.
- O `sessionStorage` também é legível por scripts, e só apaga ao fechar a aba.
- A alternativa mais segura é guardar o refresh token em cookie `httpOnly`, que o JavaScript não lê. Não fizemos isso neste trabalho.

O que reduz o dano: o access token dura só 15 minutos, o refresh token é trocado a cada uso (rotação) e a API revoga todos os tokens do usuário se detectar reutilização. Em um app mobile o certo seria usar o `SecureStore`.

## Decisões tomadas

- **Login feito no navegador.** O projeto de exemplo tinha um login por Server Action, que gravava o token em cookie, e um `proxy.ts` que conferia esse cookie. Os dois foram removidos, porque o interceptor de refresh precisa rodar no navegador.
- **Esconder menu não é segurança.** O front esconde botões e telas por perfil, mas quem bloqueia de verdade é a API (401 e 403).
- **As regras ficam na API.** Limite de 3 empréstimos, atraso e estoque são validados lá, e o front só mostra a mensagem que ela devolve.
- **Mensagens de erro vêm da API** (campo `error` da resposta), com um texto padrão quando a API está fora do ar.

## Limitações conhecidas

- O `AuthGuard` só confere se existe sessão salva. Se o token for inválido, o erro aparece na primeira chamada: o interceptor tenta renovar e, se não conseguir, volta para o login.
- O visual é simples, sem biblioteca de componentes.
- Sem paginação nas listagens.

## Como demonstrar a renovação automática

1. No `.env` da API, coloque `ACCESS_EXPIRES=30s` e reinicie a API.
2. Entre no front e espere 30 segundos.
3. Clique em qualquer tela. Na aba **Rede** do navegador (F12) aparecem, em ordem: a requisição com **401**, o `refresh` com **200** e a requisição repetida com **200**.
4. Volte para `ACCESS_EXPIRES=15m`.