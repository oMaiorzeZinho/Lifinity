const express = require('express');
const router = express.Router();

const assistantController = require('../controllers/assistantController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/messages', verifyToken, assistantController.getAssistantMessages);
router.post('/messages', verifyToken, assistantController.sendAssistantMessage);

module.exports = router;
