#include <node_api.h>
#include <math.h>
#include <string.h>

// Função interna: XP necessário para o próximo nível (Exponencial Suave)
double calcular_xp_necessario(int nivel) {
    if (nivel <= 1) return 0;
    return 100.0 * pow((double)(nivel - 1), 1.5);
}

// NOVA FUNÇÃO: Calcula XP baseado na prioridade e bónus
// FUNÇÃO EVOLUÍDA: Agora recebe Prioridade, Bónus de Velocidade e Streak
napi_value CalcularRecompensa(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Arg 0: Prioridade
    char priority[20];
    size_t str_len;
    napi_get_value_string_utf8(env, args[0], priority, 20, &str_len);

    // Arg 1: Bonus de Velocidade (boolean)
    bool has_bonus;
    napi_get_value_bool(env, args[1], &has_bonus);

    // Arg 2: Streak de dias (int)
    int32_t streak;
    napi_get_value_int32(env, args[2], &streak);

    // Lógica Base
    double xp_final = 50.0;
    if (strcmp(priority, "alta") == 0) xp_final = 100.0;
    else if (strcmp(priority, "baixa") == 0) xp_final = 20.0;

    // Aplicar Multiplicadores
    if (has_bonus) xp_final *= 1.25; // +25% Velocidade
    
    // Bónus de Streak: +5% por dia, máximo +25% (streak de 5 dias)
    double streak_mult = 1.0 + (fmin(streak, 5) * 0.05);
    xp_final *= streak_mult;

    napi_value result;
    napi_create_int32(env, (int)xp_final, &result);
    return result;
}

// Mantemos a função GetLevelData para o Dashboard
napi_value GetLevelData(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    int32_t xp;
    napi_get_value_int32(env, args[0], &xp);

    int nivel = 1;
    while (xp >= (int)calcular_xp_necessario(nivel + 1)) {
        nivel++;
    }

    double xp_atual_nivel = calcular_xp_necessario(nivel);
    double xp_prox_nivel = calcular_xp_necessario(nivel + 1);
    double progresso = ((double)xp - xp_atual_nivel) / (xp_prox_nivel - xp_atual_nivel) * 100.0;

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

// Calcula estatísticas gerais para a página de estatísticas
napi_value CalculateStats(napi_env env, napi_callback_info info) {
    size_t argc = 5;
    napi_value args[5];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    int32_t totalTasks = 0;
    int32_t completedTasks = 0;
    int32_t pendingTasks = 0;
    int32_t lostTasks = 0;
    int32_t totalXP = 0;

    napi_get_value_int32(env, args[0], &totalTasks);
    napi_get_value_int32(env, args[1], &completedTasks);
    napi_get_value_int32(env, args[2], &pendingTasks);
    napi_get_value_int32(env, args[3], &lostTasks);
    napi_get_value_int32(env, args[4], &totalXP);

    double completionRate = 0.0;
    if (totalTasks > 0) {
        completionRate = ((double)completedTasks / (double)totalTasks) * 100.0;
    }

    double productivityScore = completionRate;

    if (lostTasks > 0) {
        productivityScore -= lostTasks * 5.0;
    }

    if (productivityScore < 0.0) {
        productivityScore = 0.0;
    }

    if (productivityScore > 100.0) {
        productivityScore = 100.0;
    }

    napi_value result;
    napi_create_object(env, &result);

    napi_value nTotalTasks, nCompletedTasks, nPendingTasks, nLostTasks, nTotalXP;
    napi_value nCompletionRate, nProductivityScore;

    napi_create_int32(env, totalTasks, &nTotalTasks);
    napi_create_int32(env, completedTasks, &nCompletedTasks);
    napi_create_int32(env, pendingTasks, &nPendingTasks);
    napi_create_int32(env, lostTasks, &nLostTasks);
    napi_create_int32(env, totalXP, &nTotalXP);
    napi_create_double(env, completionRate, &nCompletionRate);
    napi_create_double(env, productivityScore, &nProductivityScore);

    napi_set_named_property(env, result, "totalTasks", nTotalTasks);
    napi_set_named_property(env, result, "completedTasks", nCompletedTasks);
    napi_set_named_property(env, result, "pendingTasks", nPendingTasks);
    napi_set_named_property(env, result, "lostTasks", nLostTasks);
    napi_set_named_property(env, result, "totalXP", nTotalXP);
    napi_set_named_property(env, result, "completionRate", nCompletionRate);
    napi_set_named_property(env, result, "productivityScore", nProductivityScore);

    return result;
}

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
