# `backend/src/routes/userRoutes.js` — rotas de utilizador (perfil, ranking, uploads)

## Papel no projeto
Endpoints relacionados com o utilizador: ranking, pesquisa, gestão da conta (password, username, bio), **upload de imagens** (avatar/cover), apagar conta e ver perfil público. Montado em `/api/users`. Todas privadas (`verifyToken`).

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/users/ranking` | `getRanking` | **Ranking** de utilizadores por XP. *(Não há `rankingRoutes.js` — o ranking vive aqui.)* |
| GET | `/api/users/search` | `searchUsers` | Procurar utilizadores. |
| PUT | `/api/users/me/password` | `updatePassword` | Mudar password. |
| PUT | `/api/users/me/username` | `updateUsername` | Mudar nome de utilizador. |
| PUT | `/api/users/me/bio` | `updateBio` | Editar bio/estado. |
| PUT | `/api/users/me/avatar` | `updateAvatar` | Carregar avatar (upload). |
| PUT | `/api/users/me/cover` | `updateCover` | Carregar imagem de capa (upload). |
| DELETE | `/api/users/me` | `deleteAccount` | Apagar a própria conta. |
| GET | `/api/users/:iduser/public-profile` | `getPublicProfile` | Ver perfil público de outro utilizador. |

## Detalhe — cadeia de middlewares no upload
```js
router.put('/me/avatar', verifyToken, handleUploadErrors(uploadAvatar.single('image')), userController.updateAvatar);
```
Correm **em cadeia**: (1) `verifyToken` autentica e preenche `req.user`; (2) `handleUploadErrors(uploadAvatar.single('image'))` recebe **um** ficheiro do campo `image`, valida formato/tamanho e converte erros do multer em JSON; (3) só então o `updateAvatar` grava o caminho na BD. A ordem importa: o upload precisa do `req.user.iduser` (do passo 1) para nomear o ficheiro.

## Ligações
- **Controlador:** `userController.js`.
- **Middlewares:** `authMiddleware`, `uploadMiddleware` (`uploadAvatar`, `uploadCover`, `handleUploadErrors`).
- **Frontend:** `Ranking.jsx`, `Profile.jsx`, `AccountSettingsModal.jsx`, `ImageUploadModal.jsx`, `PublicProfileModal.jsx`.
