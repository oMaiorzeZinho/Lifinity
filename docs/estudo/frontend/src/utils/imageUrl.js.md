# `frontend/src/utils/imageUrl.js` — construir URLs de imagens do backend

## Papel no projeto
Pequeno utilitário que transforma um caminho relativo de imagem (como vem da BD, ex.: `/uploads/avatars/avatar_3_....png`) no **URL completo** servido pelo backend.

## Conteúdo
```js
const API_URL = import.meta.env.VITE_API_URL;

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL.replace(/\/api\/?$/, '')}${path}`;
};
```
- **`import.meta.env.VITE_API_URL`** — o URL base da API (definido em `frontend/.env`, fora do git). É assim que **todo** o frontend sabe onde está o backend.
- `getImageUrl(path)`:
  - Se não houver caminho → `null` (a UI mostra um *placeholder*).
  - Se já for um URL absoluto (`http...`) → devolve tal e qual.
  - Senão, junta o caminho à **raiz** do servidor: **`API_URL.replace(/\/api\/?$/, '')`** remove o sufixo `/api` do `VITE_API_URL`. 
    - **Porquê:** as imagens são servidas pela raiz (`/uploads/...`), **não** sob `/api` (ver `index.js` → `express.static('/uploads', ...)`). Como o `VITE_API_URL` aponta para `.../api`, é preciso tirar esse `/api` para chegar à raiz onde estão os ficheiros.

## Ligações
- **Depende de:** `VITE_API_URL` (env do frontend).
- **Backend correspondente:** `express.static('/uploads', ...)` em `index.js`; caminhos gravados por `userController` (avatar/cover).
- **Usado por:** componentes/páginas que mostram avatares e covers (`Profile.jsx`, `PublicProfileModal.jsx`, `Ranking.jsx`, header do `Dashboard.jsx`, etc.).
