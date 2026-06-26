# `adapters/AchievementAdapter.java` — adapter das conquistas

## Papel
Liga a lista de `Achievement` às linhas da [`AchievementsActivity`](../AchievementsActivity.java.md): nome,
descrição, categoria, estado (desbloqueada/bloqueada), **selo de destaque** e **botão de destacar**. Padrão
base em [`TaskAdapter`](TaskAdapter.java.md).

## Pontos a notar
- **Callback de destaque** por interface:
  ```java
  public interface OnHighlightClickListener { void onHighlightClick(Achievement achievement); }
  public void setOnHighlightClickListener(OnHighlightClickListener listener) { ... }
  ```
  A activity regista-o e trata da lógica (limite de 3 / substituição). O adapter só apresenta.
- **Aparência por estado** (no `bind`):
  ```java
  itemView.setAlpha(unlocked ? 1f : 0.58f);                 // bloqueadas ficam esbatidas
  stateText.setText(unlocked ? "Desbloqueada" : "Bloqueada");
  highlightedText.setVisibility(highlighted ? VISIBLE : GONE);  // selo verde "★ Destacada"
  ```
- **Botão de destacar — só nas desbloqueadas, com texto que alterna:**
  ```java
  if (unlocked) {
      highlightButton.setVisibility(VISIBLE);
      highlightButton.setText(highlighted ? "Remover destaque" : "Destacar");
      highlightButton.setOnClickListener(v -> listener.onHighlightClick(achievement));
  } else { highlightButton.setVisibility(GONE); ... }
  ```
  Visualmente, o **selo verde "★ Destacada"** (estado) é diferente do **botão ghost "Destacar"** (ação) — o
  utilizador percebe o que está destacado vs o que pode destacar.

## Ligações
- **Layout:** `res/layout/item_achievement.xml`. **Model:** `Achievement`.
- **Usa:** `AchievementsActivity`, e a lógica de destaque em
  [FAB/XP/Foto/Destaques](../FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md).
