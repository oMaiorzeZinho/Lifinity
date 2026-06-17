# `frontend/index.html` — página HTML base (SPA)

## Papel no projeto
É a **única página HTML** servida (a app é uma SPA — Single Page Application). O React injeta toda a interface dentro dela.

## Conteúdo
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```
- **`<div id="root">`** — o "ponto de montagem": é aqui que o React desenha tudo (ver `main.jsx`, que faz `getElementById('root')`).
- **`<script type="module" src="/src/main.jsx">`** — carrega o ponto de entrada JS.
- O `viewport` torna a app **responsiva** (ajusta-se ao ecrã do telemóvel).

## Pontos a melhorar (notas de estudo)
- `lang="en"` — a UI é em **português**; o ideal seria `lang="pt"`.
- `<title>frontend</title>` — título genérico; podia ser "Lifinity".
- (Pequenos detalhes, mas fáceis de polir antes da entrega.)

## Ligações
- Carrega `src/main.jsx` → que carrega `App.jsx`.
