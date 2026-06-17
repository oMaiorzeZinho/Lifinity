# `frontend/postcss.config.js` — pipeline PostCSS

## Papel no projeto
Configura o **PostCSS**, o processador de CSS que o Vite usa para transformar o CSS antes de o entregar.

## Conteúdo
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```
- **`@tailwindcss/postcss`** — processa as diretivas do Tailwind e gera as classes utilitárias.
- **`autoprefixer`** — adiciona automaticamente prefixos de fornecedor (`-webkit-`, `-moz-`...) para compatibilidade entre browsers.

## Ligações
- Lê o `tailwind.config.js`.
- É invocado automaticamente pelo Vite durante `dev`/`build`.
