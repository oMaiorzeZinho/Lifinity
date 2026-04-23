/**
 * Motor de Gamificação do Lifinity (Versão JavaScript)
 * Esta lógica espelha o módulo nativo em C para garantir portabilidade.
 */

// Fórmula: XP = 100 * (nivel ^ 1.5)
const calculateXPForLevel = (level) => {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level - 1, 1.5));
};

const getLevelData = (xp) => {
    let level = 1;
    
    // Encontrar o nível atual baseado no XP total
    while (xp >= calculateXPForLevel(level + 1)) {
        level++;
    }

    const xpStartOfLevel = calculateXPForLevel(level);
    const xpForNextLevel = calculateXPForLevel(level + 1);
    
    // Calcular a percentagem de progresso dentro do nível atual
    const progress = ((xp - xpStartOfLevel) / (xpForNextLevel - xpStartOfLevel)) * 100;

    return {
        level: level,
        progress: Math.min(Math.max(progress, 0), 100), // Garante que fica entre 0 e 100
        nextLevelXP: xpForNextLevel,
        xpRemaining: Math.max(xpForNextLevel - xp, 0)
    };
};

module.exports = { getLevelData };
