const db = require('../config/db');
const { safeUnlockAchievementsForUser } = require('../utils/achievements');

// Função auxiliar para obter o dia do ano
const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// Obter o versículo do dia
exports.getDailyVerse = async (req, res) => {
  try {
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM bible_verse');
    const total = countRows[0].total;

    if (total === 0) {
      return res.status(404).json({ message: 'Não existem versículos na base de dados.' });
    }

    const today = new Date();
    const dayOfYear = getDayOfYear(today);

    const offset = dayOfYear % total;

    const [verseRows] = await db.query(
      'SELECT * FROM bible_verse ORDER BY idverse ASC LIMIT 1 OFFSET ?',
      [offset]
    );

    const verse = verseRows[0];

    const [favoriteRows] = await db.query(
      'SELECT * FROM favorite_verse WHERE iduser = ? AND idverse = ?',
      [req.user.iduser, verse.idverse]
    );

    res.json({
      ...verse,
      isFavorite: favoriteRows.length > 0
    });
  } catch (err) {
    console.error('Erro ao obter versículo do dia:', err);
    res.status(500).json({ message: 'Erro ao obter versículo do dia.' });
  }
};

// Obter favoritos do utilizador
exports.getFavoriteVerses = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT fv.idfavorite, bv.idverse, bv.book, bv.chapter, bv.verse, bv.text, bv.theme
       FROM favorite_verse fv
       INNER JOIN bible_verse bv ON fv.idverse = bv.idverse
       WHERE fv.iduser = ?
       ORDER BY fv.created_at DESC`,
      [req.user.iduser]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao obter favoritos:', err);
    res.status(500).json({ message: 'Erro ao obter favoritos.' });
  }
};

// Alternar favorito (adicionar/remover)
exports.toggleFavoriteVerse = async (req, res) => {
  try {
    const { idverse } = req.params;

    const [existing] = await db.query(
      'SELECT * FROM favorite_verse WHERE iduser = ? AND idverse = ?',
      [req.user.iduser, idverse]
    );

    if (existing.length > 0) {
      await db.query(
        'DELETE FROM favorite_verse WHERE iduser = ? AND idverse = ?',
        [req.user.iduser, idverse]
      );

      return res.json({
        message: 'Versículo removido dos favoritos.',
        isFavorite: false
      });
    }

    await db.query(
      'INSERT INTO favorite_verse (iduser, idverse) VALUES (?, ?)',
      [req.user.iduser, idverse]
    );

    await safeUnlockAchievementsForUser(req.user.iduser);

    res.json({
      message: 'Versículo adicionado aos favoritos.',
      isFavorite: true
    });
  } catch (err) {
    console.error('Erro ao alternar favorito:', err);
    res.status(500).json({ message: 'Erro ao atualizar favorito.' });
  }
};

// Obter um versículo aleatório
exports.getRandomVerse = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM bible_verse ORDER BY RAND() LIMIT 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Não existem versículos na base de dados.' });
    }

    const verse = rows[0];

    const [favoriteRows] = await db.query(
      'SELECT * FROM favorite_verse WHERE iduser = ? AND idverse = ?',
      [req.user.iduser, verse.idverse]
    );

    res.json({
      ...verse,
      isFavorite: favoriteRows.length > 0
    });
  } catch (err) {
    console.error('Erro ao obter versículo aleatório:', err);
    res.status(500).json({ message: 'Erro ao obter versículo aleatório.' });
  }
};
