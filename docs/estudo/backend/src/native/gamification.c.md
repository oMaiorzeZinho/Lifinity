# `backend/src/native/gamification.c` — módulo nativo em C (N-API)

## Papel no projeto
É o **módulo C compilado** que cumpre o requisito da PAP de ter "funções de alta performance em C ligadas ao Node via N-API". Expõe ao JavaScript três funções: cálculo de **recompensa de XP**, **dados de nível** e **estatísticas**. Compilado pelo `node-gyp` (ver `binding.gyp`) para `build/Release/gamification.node`.

## Conceitos de N-API (para reler no futuro)
N-API é a ponte oficial entre C e Node.js. Pontos-chave que se repetem no ficheiro:
- **`napi_env env`** — o "contexto" do motor JS; passa-se a quase todas as chamadas.
- **`napi_value`** — um *handle opaco* para um valor JavaScript (número, string, objeto…). Em C não se mexe diretamente nos valores JS; pede-se ao N-API para os ler/criar.
- **`napi_get_cb_info(...)`** — obtém os argumentos com que a função foi chamada do lado JS.
- **`napi_get_value_*`** — converte um `napi_value` (JS) para um tipo C (`int32`, `bool`, string…).
- **`napi_create_*`** — cria um `napi_value` (JS) a partir de um valor C (para devolver resultados).
- **`napi_set_named_property(...)`** — adiciona um campo a um objeto JS (constrói o objeto de retorno).

## Bloco a bloco

```c
#include <node_api.h>   // N-API
#include <math.h>       // pow, fmin
#include <string.h>     // strcmp
```
Inclui o cabeçalho do N-API e as bibliotecas C para matemática (`pow`, `fmin`) e comparação de strings (`strcmp`).

### Função auxiliar `calcular_xp_necessario`
```c
double calcular_xp_necessario(int nivel) {
    if (nivel <= 1) return 0;
    return 100.0 * pow((double)(nivel - 1), 1.5);
}
```
Mesma fórmula do `gamification.js`: XP total para um nível = `100 * (nivel-1)^1.5`. É interna (em C puro, não exposta a JS). **Consistente com a versão JavaScript** (ambas usam `nivel-1`).

### `CalcularRecompensa` — XP ganho ao concluir uma tarefa
```c
napi_value CalcularRecompensa(napi_env env, napi_callback_info info) {
    size_t argc = 3; napi_value args[3];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    char priority[20]; size_t str_len;
    napi_get_value_string_utf8(env, args[0], priority, 20, &str_len);  // Arg 0: prioridade (string)
    bool has_bonus; napi_get_value_bool(env, args[1], &has_bonus);     // Arg 1: bónus velocidade (bool)
    int32_t streak; napi_get_value_int32(env, args[2], &streak);       // Arg 2: streak (int)
```
Recebe 3 argumentos do JS e converte-os para tipos C: a prioridade (string até 20 chars), se tem bónus de velocidade (boolean) e o streak (inteiro).

```c
    double xp_final = 50.0;
    if (strcmp(priority, "alta") == 0) xp_final = 100.0;
    else if (strcmp(priority, "baixa") == 0) xp_final = 20.0;
```
**XP base por prioridade:** média = 50 (valor por defeito), **alta = 100**, **baixa = 20**. `strcmp(a,b)==0` significa "strings iguais".

```c
    if (has_bonus) xp_final *= 1.25;                       // +25% por velocidade
    double streak_mult = 1.0 + (fmin(streak, 5) * 0.05);  // +5%/dia, máx +25% (5 dias)
    xp_final *= streak_mult;
    napi_value result; napi_create_int32(env, (int)xp_final, &result);
    return result;
}
```
- **Bónus de velocidade:** +25% se concluída rápido.
- **Bónus de streak:** +5% por cada dia de streak, **limitado a 5 dias** (`fmin(streak,5)`) → no máximo +25%.
- Converte o resultado final para inteiro JS e devolve-o.
- **Exemplo:** prioridade alta (100) + bónus (×1.25 = 125) + streak 3 (×1.15 ≈ 143) → devolve `143`.

### `GetLevelData` — nível e progresso a partir do XP
```c
napi_value GetLevelData(napi_env env, napi_callback_info info) {
    ... napi_get_value_int32(env, args[0], &xp);          // recebe o XP total
    int nivel = 1;
    while (xp >= (int)calcular_xp_necessario(nivel + 1)) nivel++;   // sobe enquanto chegar
    double xp_atual_nivel = calcular_xp_necessario(nivel);
    double xp_prox_nivel  = calcular_xp_necessario(nivel + 1);
    double progresso = ((double)xp - xp_atual_nivel) / (xp_prox_nivel - xp_atual_nivel) * 100.0;
```
Lógica idêntica ao `getLevelData` do JS: encontra o nível por iteração e calcula a percentagem de progresso dentro do nível.

```c
    napi_value result, n_nivel, n_progresso, n_proximo;
    napi_create_object(env, &result);
    napi_create_int32(env, nivel, &n_nivel);
    napi_create_double(env, progresso, &n_progresso);
    napi_create_double(env, xp_prox_nivel, &n_proximo);
    napi_set_named_property(env, result, "level", n_nivel);
    napi_set_named_property(env, result, "progress", n_progresso);
    napi_set_named_property(env, result, "nextLevelXP", n_proximo);
    return result;
}
```
Constrói **manualmente** um objeto JS `{ level, progress, nextLevelXP }`. (Em C não há literais de objeto — cria-se o objeto e adiciona-se cada propriedade à mão.) Note-se que aqui **não** devolve `xpRemaining` (a versão JS devolvia).

### `CalculateStats` — métricas para a página de estatísticas
```c
napi_value CalculateStats(napi_env env, napi_callback_info info) {
    ... // recebe 5 inteiros: totalTasks, completedTasks, pendingTasks, lostTasks, totalXP
    double completionRate = 0.0;
    if (totalTasks > 0) completionRate = ((double)completedTasks / totalTasks) * 100.0;

    double productivityScore = completionRate;
    if (lostTasks > 0) productivityScore -= lostTasks * 5.0;   // penaliza tarefas perdidas
    if (productivityScore < 0.0)   productivityScore = 0.0;    // clamp 0..100
    if (productivityScore > 100.0) productivityScore = 100.0;
    ...
}
```
- **`completionRate`** — percentagem de tarefas concluídas (concluídas / total × 100), com proteção contra divisão por zero.
- **`productivityScore`** — parte da taxa de conclusão e **penaliza 5 pontos por cada tarefa perdida** (`lostTasks`), "preso" entre 0 e 100.
- Devolve um objeto JS com as 5 entradas mais `completionRate` e `productivityScore` (mesmo padrão de construção de objeto que acima).

### `init` e registo do módulo
```c
napi_value init(napi_env env, napi_value exports) {
    napi_value fn_level, fn_reward, fn_stats;
    napi_create_function(env, NULL, 0, GetLevelData, NULL, &fn_level);
    napi_create_function(env, NULL, 0, CalcularRecompensa, NULL, &fn_reward);
    napi_create_function(env, NULL, 0, CalculateStats, NULL, &fn_stats);
    napi_set_named_property(env, exports, "getLevelData", fn_level);
    napi_set_named_property(env, exports, "calcularRecompensa", fn_reward);
    napi_set_named_property(env, exports, "calculateStats", fn_stats);
    return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
```
- `init` é a função de arranque do módulo: "envelopa" cada função C num `napi_value` e **expõe-na** com um nome JavaScript. Do lado JS, o módulo fica `{ getLevelData, calcularRecompensa, calculateStats }`.
- **`NAPI_MODULE(NODE_GYP_MODULE_NAME, init)`** — macro que regista `init` como ponto de entrada do módulo nativo. `NODE_GYP_MODULE_NAME` resolve para `gamification` (o `target_name` do `binding.gyp`).

> Nota: a indentação de `init` está recuada no original — é inofensivo em C (o compilador ignora espaços).

## Diferenças face ao `gamification.js` (importante)
- O C expõe **3** funções; o JS só replica **`getLevelData`**.
- `calcularRecompensa` (XP por tarefa, com bónus de velocidade e streak) e `calculateStats` (taxa de conclusão, score de produtividade) **só existem em C**.
- ⚠️ É preciso confirmar **quem chama o quê**: provavelmente o `taskController` usa `calcularRecompensa` do `.node` ao concluir tarefas, e o `statisticsController` usa `calculateStats`. [Confirmar ao documentar esses controladores e o `index.js`.]

## Ligações
- **Compilado por:** `node-gyp` via `backend/binding.gyp` → `build/Release/gamification.node`.
- **Carregado por:** o backend, provavelmente com `require('../build/...gamification.node')` ou pacote `bindings` (verificar nos controladores).
- **Espelho parcial em JS:** `backend/src/utils/gamification.js`.
- **Consumidores prováveis:** `taskController.js` (recompensa), `statisticsController.js` (stats), dashboard/perfil (nível).
