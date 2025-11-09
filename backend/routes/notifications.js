const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications
} = require('../controllers/notificationController');

router.use(auth);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);
router.delete('/:notificationId', deleteNotification);
router.delete('/read', deleteReadNotifications);

module.exports = router;
