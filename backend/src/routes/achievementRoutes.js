const express = require('express');
const router = express.Router();

const achievementController = require('../controllers/achievementController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', verifyToken, achievementController.getAchievements);
router.put('/highlights', verifyToken, achievementController.updateHighlights);
router.post('/check', verifyToken, achievementController.checkAchievements);

module.exports = router;
