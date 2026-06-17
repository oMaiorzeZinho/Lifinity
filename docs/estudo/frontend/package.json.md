# `frontend/package.json` — manifesto e dependências do frontend

## Papel no projeto
Manifesto do projeto React. Define scripts (Vite) e as bibliotecas do frontend.

## Bloco a bloco
```json
"private": true,
"type": "module",
"scripts": { "dev": "vite", "build": "vite build", "lint": "eslint .", "preview": "vite preview" }
```
- `type: "module"` → o frontend usa **ES Modules** (`import`/`export`), ao contrário do backend (CommonJS).
- `npm run dev` arranca o servidor de desenvolvimento Vite (porta 5173); `build` gera a versão de produção; `preview` serve essa build; `lint` corre o ESLint.

### Dependencies
| Pacote | Versão | Para que serve |
|---|---|---|
| `react` / `react-dom` | ^19.2 | A biblioteca de UI (React 19, a versão mais recente). |
| `react-router-dom` | ^7.14 | Navegação/rotas SPA (usado em `App.jsx`). |
| `axios` | ^1.15 | Cliente HTTP para chamar a API do backend. |
| `recharts` | ^3.8 | Gráficos da página de Estatísticas. |
| `@tailwindcss/postcss` | ^4.2 | Integração do Tailwind v4 via PostCSS. |

### devDependencies (destaques)
- `vite` ^8 + `@vitejs/plugin-react` — bundler/servidor de desenvolvimento.
- `tailwindcss` ^4.2 + `autoprefixer` + `postcss` — estilização.
- `eslint` + plugins de React Hooks/Refresh — análise estática.

## Porquê estas escolhas
Stack moderna e "impressionante": **React 19 + Vite** dá arranque/recarga instantâneos; **Tailwind** acelera o design; **Recharts** dá gráficos bonitos com pouco código; **axios** simplifica os pedidos à API.

## Ligações
- Versões exatas em `package-lock.json` (não documentado — gerado).
- O `build` produz ficheiros estáticos que poderiam ser servidos em produção.
