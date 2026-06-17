# `frontend/src/main.jsx` — ponto de entrada do React

## Papel no projeto
"Liga" o React à página: pega no componente raiz `App` e desenha-o dentro do `<div id="root">` do `index.html`.

## Conteúdo
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
- **`import './index.css'`** — importa os estilos globais (Tailwind + tema clay). Por estar aqui, aplicam-se a toda a app.
- **`createRoot(...).render(...)`** — API do React 18/19 para montar a aplicação no elemento `root`.
- **`<StrictMode>`** — modo de desenvolvimento do React que ajuda a detetar problemas (faz, por exemplo, *double-invoke* de efeitos em dev para apanhar bugs). Não afeta produção.

## Ligações
- **Renderiza:** `App.jsx` (que tem o routing).
- **Estilos:** `src/index.css`.
- **Montagem:** `#root` em `index.html`.
