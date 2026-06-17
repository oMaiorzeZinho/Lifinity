# `backend/src/routes/achievementRoutes.js` — rotas de conquistas

## Papel no projeto
Endpoints das conquistas (listar, destacar, verificar). Montado em `/api/achievements`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/achievements/` | `getAchievements` | Lista de conquistas (ganhas/por ganhar) do utilizador. |
| PUT | `/api/achievements/highlights` | `updateHighlights` | Definir os ≤3 badges em destaque no perfil. |
| POST | `/api/achievements/check` | `checkAchievements` | Forçar verificação/desbloqueio de conquistas. |

## Ligações
- **Controlador:** `achievementController.js`, que usa o motor `utils/achievements.js`.
- **Tabelas:** `BADGE`, `USER_BADGE`, `USER_BADGE_HIGHLIGHT`.
- **Frontend:** `Profile.jsx` (e modal de conquistas).
