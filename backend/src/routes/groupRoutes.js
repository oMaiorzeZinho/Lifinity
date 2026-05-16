const express = require('express');
const router = express.Router();

const groupController = require('../controllers/groupController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', verifyToken, groupController.getMyGroups);
router.post('/', verifyToken, groupController.createGroup);
router.post('/join', verifyToken, groupController.joinGroupByCode);
router.post('/:idgroup/conversation', verifyToken, groupController.getOrCreateConversationForGroup);
router.get('/:idgroup/members', verifyToken, groupController.getGroupMembers);
router.delete('/:idgroup/leave', verifyToken, groupController.leaveGroup);
router.delete('/:idgroup', verifyToken, groupController.deleteGroup);

module.exports = router;
