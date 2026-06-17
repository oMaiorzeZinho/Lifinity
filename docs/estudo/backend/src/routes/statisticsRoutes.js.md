# `backend/src/routes/statisticsRoutes.js` — rotas de estatísticas

## Papel no projeto
Endpoints da página de estatísticas (resumo próprio e comparações). Montado em `/api/statistics`. Todas privadas. (Aqui o middleware é importado com o nome `authMiddleware`, mas é a mesma função `verifyToken`.)

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/statistics/me` | `getMyStatistics` | Estatísticas do próprio utilizador (gráficos, totais). |
| GET | `/api/statistics/compare/friend/:idfriend` | `compareWithFriend` | Comparar com um amigo. |
| GET | `/api/statistics/compare/group/:idgroup` | `compareWithGroup` | Comparar com um grupo. |

## Ligações
- **Controlador:** `statisticsController.js` (usa `XP_HISTORY`, `TASK`, e provavelmente o módulo C `calculateStats`).
- **Frontend:** `Statistics.jsx`.
