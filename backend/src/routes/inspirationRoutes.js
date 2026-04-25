const express = require('express');
const router = express.Router();

const inspirationController = require('../controllers/inspirationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/daily', authMiddleware, inspirationController.getDailyVerse);
router.get('/favorites', authMiddleware, inspirationController.getFavoriteVerses);
router.post('/favorite/:idverse', authMiddleware, inspirationController.toggleFavoriteVerse);
router.get('/random', authMiddleware, inspirationController.getRandomVerse);

module.exports = router;