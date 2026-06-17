# `backend/src/utils/gamification.js` — fórmula de XP/nível (versão JavaScript)

## Papel no projeto
Contém a **lógica de níveis em JavaScript puro**. O cabeçalho diz que "espelha o módulo nativo em C para garantir portabilidade" — ou seja, é uma versão de recurso, em JS, da mesma matemática que está em `gamification.c`. Dado um total de XP, calcula em que nível o utilizador está e quanto falta para o próximo.

## Bloco a bloco

```js
// Fórmula: XP = 100 * (nivel ^ 1.5)
const calculateXPForLevel = (level) => {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level - 1, 1.5));
};
```
Devolve o **XP total necessário para atingir** um dado nível.
- Nível 1 (ou menos) → 0 XP (toda a gente começa no nível 1).
- Para os outros: `100 * (nivel-1)^1.5`, arredondado para baixo (`Math.floor`).
- ⚠️ **Aviso de estudo:** o comentário diz `100 * (nivel ^ 1.5)`, mas o código usa **`(level - 1)`**, não `level`. A fórmula real é `100 * (nivel-1)^1.5`. O comentário está ligeiramente errado — segue o **código**. (O módulo C usa a mesma `(nivel-1)`, por isso JS e C estão consistentes entre si.)
- Exemplos: nível 2 → `100*1^1.5 = 100`; nível 3 → `100*2^1.5 ≈ 282`; nível 5 → `100*4^1.5 = 800`.

```js
const getLevelData = (xp) => {
    let level = 1;
    while (xp >= calculateXPForLevel(level + 1)) {
        level++;
    }
```
- Começa no nível 1 e **sobe enquanto** o XP chegar para o nível seguinte. Quando parar, `level` é o nível atual.
- Exemplo: com 300 XP → chega para o nível 3 (282) mas não para o 4 (≈620) → fica nível 3.

```js
    const xpStartOfLevel = calculateXPForLevel(level);
    const xpForNextLevel = calculateXPForLevel(level + 1);
    const progress = ((xp - xpStartOfLevel) / (xpForNextLevel - xpStartOfLevel)) * 100;

    return {
        level: level,
        progress: Math.min(Math.max(progress, 0), 100),
        nextLevelXP: xpForNextLevel,
        xpRemaining: Math.max(xpForNextLevel - xp, 0)
    };
};
```
- `progress` — **percentagem** de avanço dentro do nível atual: quanto do caminho entre o início deste nível e o início do próximo já foi feito.
- **`Math.min(Math.max(progress, 0), 100)`** — "prende" o valor entre 0 e 100 (evita percentagens negativas ou acima de 100 por arredondamentos). É o padrão *clamp*.
- `nextLevelXP` — XP total para o próximo nível; `xpRemaining` — quanto falta (nunca negativo, por causa do `Math.max(..., 0)`).

```js
module.exports = { getLevelData };
```
Exporta **apenas** `getLevelData`.

## Porquê esta versão JS existir (havendo a C)
- O módulo nativo em C tem de ser **compilado** (`node-gyp`) e depende de ter build tools instaladas. Se a compilação falhar numa máquina, esta versão JS serve de **plano B** ("portabilidade"), garantindo que a app de níveis continua a funcionar.
- ⚠️ Nota: a versão JS só replica `getLevelData`. As outras funções do C (`calcularRecompensa`, `calculateStats`) **não** têm equivalente aqui. Por isso, é preciso ver no código quem realmente é usado: o `.node` compilado ou este fallback. [Confirmar em `taskController.js`/`statisticsController.js` e `index.js`.]

## Ligações
- **Espelha:** `backend/src/native/gamification.c` (mesma fórmula de níveis).
- **Possíveis consumidores:** controladores que mostram nível/progresso (dashboard, perfil, estatísticas). Verificar quais importam este módulo vs. o `.node`.
