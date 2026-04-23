const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/ranking', verifyToken, userController.getRanking);
router.get('/search', verifyToken, userController.searchUsers);

module.exports = router;
