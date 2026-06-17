# `backend/src/routes/inspirationRoutes.js` — rotas de inspiração (versículos)

## Papel no projeto
Endpoints do módulo de inspiração diária (versículos e favoritos). Montado em `/api/inspiration`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/inspiration/daily` | `getDailyVerse` | Versículo do dia (determinístico por data). |
| GET | `/api/inspiration/favorites` | `getFavoriteVerses` | Lista de versículos favoritos do utilizador. |
| POST | `/api/inspiration/favorite/:idverse` | `toggleFavoriteVerse` | Adicionar/remover dos favoritos (toggle). |
| GET | `/api/inspiration/random` | `getRandomVerse` | Versículo aleatório. |

## Nota
`toggleFavoriteVerse` é **toggle**: o mesmo endpoint adiciona se não existir e remove se já estiver favoritado (em vez de ter duas rotas separadas).

## Ligações
- **Controlador:** `inspirationController.js` (`BIBLE_VERSE`, `FAVORITE_VERSE`).
- **Frontend:** `Inspiration.jsx`, `DailyVerseWidget.jsx`.
