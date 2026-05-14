const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', verifyToken, notificationController.getNotifications);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);
router.put('/:idnotification/read', verifyToken, notificationController.markNotificationAsRead);
router.put('/read-all', verifyToken, notificationController.markAllNotificationsAsRead);

module.exports = router;
