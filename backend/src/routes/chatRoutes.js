const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/conversations', verifyToken, chatController.getConversations);
router.post('/conversations/private', verifyToken, chatController.createPrivateConversation);
router.post('/conversations/group', verifyToken, chatController.createGroupConversation);
router.get('/conversations/:idconversation/members', verifyToken, chatController.getConversationMembers);
router.post('/conversations/:idconversation/members', verifyToken, chatController.addConversationMembers);
router.delete('/conversations/:idconversation/members/:iduser', verifyToken, chatController.removeConversationMember);
router.get('/conversations/:idconversation/messages', verifyToken, chatController.getMessages);
router.post('/conversations/:idconversation/messages', verifyToken, chatController.sendMessage);

module.exports = router;
