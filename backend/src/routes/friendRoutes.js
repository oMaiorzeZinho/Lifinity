const express = require('express');
const router = express.Router();

const friendController = require('../controllers/friendController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/search', verifyToken, friendController.searchUsers);
router.get('/', verifyToken, friendController.getFriends);
router.get('/requests', verifyToken, friendController.getFriendRequests);
router.post('/request', verifyToken, friendController.sendFriendRequest);
router.put('/requests/:idfriendship/accept', verifyToken, friendController.acceptFriendRequest);
router.delete('/requests/:idfriendship', verifyToken, friendController.declineFriendRequest);
router.delete('/:idfriend', verifyToken, friendController.removeFriend);

module.exports = router;
