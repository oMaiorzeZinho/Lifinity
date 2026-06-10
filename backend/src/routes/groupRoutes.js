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
router.put('/:idgroup/members/:iduser/mute', verifyToken, groupController.muteGroupMember);
router.put('/:idgroup/members/:iduser/unmute', verifyToken, groupController.unmuteGroupMember);
router.delete('/:idgroup/members/:iduser', verifyToken, groupController.kickGroupMember);
router.put('/:idgroup/lock', verifyToken, groupController.toggleGroupLock);
router.delete('/:idgroup', verifyToken, groupController.deleteGroup);

module.exports = router;
