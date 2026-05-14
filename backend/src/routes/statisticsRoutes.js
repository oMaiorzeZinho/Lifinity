const express = require('express');
const router = express.Router();

const statisticsController = require('../controllers/statisticsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/me', authMiddleware, statisticsController.getMyStatistics);
router.get('/compare/friend/:idfriend', authMiddleware, statisticsController.compareWithFriend);
router.get('/compare/group/:idgroup', authMiddleware, statisticsController.compareWithGroup);

module.exports = router;
