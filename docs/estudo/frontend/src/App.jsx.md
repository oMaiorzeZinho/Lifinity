# `frontend/src/App.jsx` — routing da aplicação

## Papel no projeto
Define **todas as rotas** (URLs → páginas) da SPA, com carregamento preguiçoso (lazy) das páginas. É o "mapa de navegação" do frontend.

## Bloco a bloco

```jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
... (cada página é lazy) ...
```
- **`lazy(() => import(...))`** — cada página é carregada **só quando é precisa** (*code splitting*). Resultado: o arranque é mais rápido porque não se descarrega o código de todas as páginas de uma vez.
- `BrowserRouter` (apelidado `Router`) ativa o routing baseado no URL do browser.

```jsx
const PageLoader = () => (
  <div className="min-h-screen bg-[#101713] ...">A carregar...</div>
);
```
- Componente mostrado **enquanto** uma página lazy está a ser descarregada (o `fallback` do `Suspense`). A cor `#101713` (verde muito escuro) confirma o **tema escuro/clay** da app.

```jsx
<Router>
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<Contact />} />   {/* pública */}

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="tasks" replace />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="community" element={<Community />} />
        <Route path="inspiration" element={<Inspiration />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="chat" element={<Chat />} />
        <Route path="contact" element={<Contact />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Suspense>
</Router>
```
- **Rotas públicas (de topo):** `/` (Home), `/login`, `/register`, `/contact`.
- **`/dashboard` com rotas aninhadas:** `DashboardLayout` (a página `Dashboard.jsx`) é o "molde" (header, navegação) e as sub-páginas aparecem dentro dele (via `<Outlet/>`, ver `Dashboard.jsx`).
  - **`<Route index ... Navigate to="tasks">`** — abrir `/dashboard` **redireciona** para `/dashboard/tasks` (a página inicial do painel). O `replace` evita criar uma entrada extra no histórico.
  - As sub-rotas: tasks, ranking, community, inspiration, statistics, profile, chat, contact.
- **`<Route path="*" ... Navigate to="/">`** — qualquer URL desconhecido volta à Home (catch-all).

## Observação importante (segurança/auth)
- **Não há "rota protegida" aqui:** o `/dashboard` não está envolvido por um guard que verifique o token. Logo, a proteção de autenticação tem de ser feita **dentro** das páginas (ex.: o `Dashboard.jsx` redireciona para `/login` se não houver token no `localStorage`). [Confirmar ao documentar `Dashboard.jsx`.]
- ⚠️ Ponto a rever: idealmente existiria um componente `ProtectedRoute` a envolver o dashboard, para centralizar essa verificação.

## Ligações
- **Renderiza:** todas as páginas em `src/pages/`.
- **Layout do painel:** `Dashboard.jsx` (contém o `<Outlet/>` onde as sub-páginas entram).
- Montado por `main.jsx`.
