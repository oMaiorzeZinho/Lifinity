# `frontend/vite.config.js` — configuração do Vite

## Papel no projeto
Configura o **Vite** (bundler e servidor de desenvolvimento do frontend).

## Conteúdo
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { rolldownOptions: { checks: { pluginTimings: false } } },
  server: { allowedHosts: true } // permite qualquer host (útil na apresentação/ngrok)
})
```
- **`plugins: [react()]`** — ativa o suporte a React (JSX, Fast Refresh).
- **`build.rolldownOptions`** — o Vite 8 usa o **Rolldown** (bundler em Rust) por baixo; aqui desliga uns avisos de *timings* de plugins. Detalhe técnico, sem impacto funcional.
- **`server.allowedHosts: true`** — aceita pedidos de **qualquer host**. Comentado no código: facilita expor o dev server (ex.: via **ngrok**) durante a apresentação, sem o Vite bloquear o domínio externo.

## Ligações
- O `VITE_API_URL` (URL do backend) **não** está aqui — é uma variável de ambiente lida via `import.meta.env.VITE_API_URL` (ficheiro `frontend/.env`, fora do git).
