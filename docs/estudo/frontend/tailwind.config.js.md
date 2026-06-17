# `frontend/tailwind.config.js` — configuração do Tailwind CSS

## Papel no projeto
Configura o **Tailwind CSS** (framework de CSS por utilitários).

## Conteúdo
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```
- **`content`** — diz ao Tailwind **onde procurar** classes utilizadas, para gerar só o CSS necessário (*tree-shaking* de CSS). Inclui o HTML e todos os ficheiros `src`.
- **`theme.extend`** vazio e **`plugins`** vazio — não há personalização de tema **aqui**.

## Nota importante (Tailwind v4)
O projeto usa **Tailwind v4** (via `@tailwindcss/postcss`). No v4, grande parte da configuração/tema costuma viver **no próprio CSS** (em `src/index.css`, com `@theme`/diretivas), não neste ficheiro. Por isso este config está quase vazio — as cores e o estilo "clay/escuro" provavelmente estão definidos em `index.css`. [Confirmar ao documentar `index.css`.]

## Ligações
- Trabalha com `postcss.config.js` (que aplica o plugin Tailwind).
- As cores/estética reais: ver `frontend/src/index.css`.
