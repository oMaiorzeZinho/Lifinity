# `AchievementsActivity.java` — todas as conquistas + destacar

## Papel
Lista **todas** as conquistas (desbloqueadas e bloqueadas) e permite escolher as **3 em destaque** (as que
aparecem no Perfil). Abre-se pelo botão "Ver todas" do Perfil.

## `onCreate` / carregar
- Cria o [`AchievementAdapter`](adapters/AchievementAdapter.java.md) e regista o *callback* de destaque
  (`achievementAdapter.setOnHighlightClickListener(this::onHighlightClick)`).
- `loadAchievements`: **`POST /achievements/check`** (reavalia/desbloqueia) e depois **`GET /achievements`**;
  guarda a lista em `currentAchievements` e passa-a ao adapter. Mostra "vazio" se não houver.

## Destacar — `onHighlightClick`
Ao tocar no botão de destaque de uma conquista **desbloqueada**:
```java
List<Achievement> highlights = getCurrentHighlights();      // as atuais, ordenadas por position
if (achievement.isHighlighted()) { remove-a (toggle); submit; return; }
if (highlights.size() < 3) { adiciona; submit; return; }
promptReplaceHighlight(highlights, achievement);            // já há 3 → escolher qual substituir
```
- **< 3 destaques** → adiciona; **já 3** → abre um **`AlertDialog`** (tema claro) a listar os 3 atuais para o
  utilizador **escolher qual substituir**; **já destacada** → remove (toggle).
- **`submitHighlights`** reatribui as **posições 1..n** pela ordem da lista, constrói o corpo
  (`{ highlights: [ {idbadge, position}, ... ] }` com `JsonObject`/`JsonArray`) e faz
  **`PUT /achievements/highlights`**. Em sucesso, `Toast` + **recarrega** a lista (e o Perfil relê os
  destaques no `onResume`).
- **Validações:** nunca mais de 3, posições 1..3, só desbloqueadas (o backend revalida).

## Distinção visual
No item, o **selo verde "★ Destacada"** (já em destaque) é diferente do **botão ghost "Destacar"/"Remover
destaque"** (ação). Detalhe em
[FAB/XP/Foto/Destaques](FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md).

## Ligações
- **API/Backend:** [`AchievementApi`](api/AchievementApi.java.md) → `achievementController`.
- **Model/Adapter:** `Achievement`, `AchievementAdapter`. **Abre a partir de:** `ProfileActivity`.
