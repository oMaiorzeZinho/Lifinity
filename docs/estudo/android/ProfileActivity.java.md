# `ProfileActivity.java` — ecrã de perfil

## Papel
Mostra o **perfil** do utilizador: avatar, nome, email, nível/XP com **barra de progresso**, **resumo de
atividades** (total/concluídas/pendentes/perdidas) e as **conquistas em destaque**. Permite **mudar a foto**
(galeria) e terminar sessão. É a tab Perfil.

## `onCreate` / `onResume`
- `onCreate`: guarda de sessão, `BottomNavHelper`/`HeaderHelper`, **regista o photo picker** (ver abaixo),
  `bindViews`, `setupButtons`, e mostra o user guardado de imediato (`bindUser(getSavedUser())`).
- **`onResume`** recarrega o resumo de atividades e as conquistas — assim, ao **voltar** das Conquistas
  (onde se mudaram os destaques) ou das Tarefas, o perfil reflete o estado novo.

## `bindUser` + `bindLevelProgress` — cartão de XP correto
```java
int displayLevel = xp != null ? calculateLevelFromXp(safeXp) : (level == null ? 1 : Math.max(level, 1));
...
int progress = Math.round(((xp - currentLevelXp) * 100f) / levelSpan);
levelProgressLabel.setText(remaining + " XP para nivel " + (level + 1) + "  (" + progress + "%)");
```
- **Pormenor importante:** o nível é **derivado do XP** (mesma fórmula do backend) em vez de se confiar no
  `level` guardado (que podia estar dessincronizado e fazer a barra parecer cheia). A barra usa o drawable
  `xp_progress_bar`. Ver [FAB/XP/Foto/Destaques](FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md).
- O avatar é carregado pelo [`AvatarLoader`](utils/_UTILS_IMAGENS.md) (foto real ou inicial).

## Resumo de atividades — calculado no cliente
`loadActivitySummary` faz `GET /tasks` e conta localmente: concluídas (`isTaskCompleted`), perdidas
(`isTaskLost` = não concluída + prazo passado) e pendentes. Mostra os totais nos cartões. Reutiliza a mesma
lógica de estado da `TasksActivity`.

## Conquistas em destaque
`loadAchievements` faz **`POST /achievements/check`** (reavalia) e depois **`GET /achievements`**; de seguida
separa as desbloqueadas, ordena os **destaques** por `position` e preenche até 3 linhas. O botão "Ver todas"
abre a [`AchievementsActivity`](AchievementsActivity.java.md).

## Mudar a foto de perfil (galeria → upload)
```java
pickImageLauncher = registerForActivityResult(new ActivityResultContracts.GetContent(),
        uri -> { if (uri != null) uploadAvatar(uri); });
...
editAvatarBadge.setOnClickListener(v -> pickImageLauncher.launch("image/*"));
```
- **Photo picker** (`GetContent`) — abre a galeria **sem pedir permissões perigosas**. Tem de ser
  **registado no `onCreate`** (antes de o ecrã ficar ativo).
- `uploadAvatar(uri)` lê os bytes do `Uri` (via `ContentResolver`), valida (≤ 2MB, jpeg/png/webp), constrói
  o multipart (campo `image`) e faz `PUT /users/me/avatar`. Em sucesso atualiza a foto no cartão, a
  miniatura da barra e o `avatar` nas `SharedPreferences`. Detalhe em
  [FAB/XP/Foto/Destaques](FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md).

## Terminar sessão
`logout()` apaga token + user das `SharedPreferences` e volta ao login (limpando a pilha).

## Ligações
- **APIs/Backend:** [`UserApi`](api/UserApi.java.md) (avatar), [`TaskApi`](api/TaskApi.java.md) (resumo),
  [`AchievementApi`](api/AchievementApi.java.md) (conquistas).
- **Models:** `User`, `Task`, `Achievement`. **Abre:** `AchievementsActivity`, `SettingsActivity` (engrenagem).
