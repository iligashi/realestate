const { Notification, Property, User, Message } = require('../models');
const { Op } = require('sequelize');

const includeNotificationRelations = [
  {
    model: Property,
    as: 'relatedProperty',
    attributes: ['id', 'title', 'address', 'price', 'propertyType']
  },
  {
    model: User,
    as: 'relatedUser',
    attributes: ['id', 'firstName', 'lastName', 'email']
  },
  {
    model: Message,
    as: 'relatedMessage',
    attributes: ['id', 'subject', 'createdAt']
  }
];

const serializeNotification = (notificationInstance) => {
  const notification = notificationInstance.toJSON();
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    priority: notification.priority,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    scheduledFor: notification.scheduledFor,
    expiresAt: notification.expiresAt,
    actions: notification.actions || [],
    tags: notification.tags || [],
    deliveryStatus: notification.deliveryStatus || {},
    analytics: notification.analytics || {},
    source: notification.source,
    category: notification.category,
    metadata: {
      relatedPropertyId: notification.relatedPropertyId,
      relatedUserId: notification.relatedUserId,
      relatedMessageId: notification.relatedMessageId
    },
    relatedProperty: notification.relatedProperty || null,
    relatedUser: notification.relatedUser || null,
    relatedMessage: notification.relatedMessage || null
  };
};

const getNotifications = async (req, res) => {
  try {
    const { type, priority, read } = req.query;
    const whereClause = {
      recipientId: req.user.id
    };

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    if (read === 'unread') {
      whereClause.isRead = false;
    } else if (read === 'read') {
      whereClause.isRead = true;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      include: includeNotificationRelations,
      order: [['created_at', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      notifications: notifications.map(serializeNotification),
      unreadCount: await Notification.count({
        where: {
          recipientId: req.user.id,
          isRead: false
        }
      })
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load notifications',
      error: error.message
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        recipientId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          recipientId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const deleted = await Notification.destroy({
      where: {
        id: notificationId,
        recipientId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

const deleteReadNotifications = async (req, res) => {
  try {
    await Notification.destroy({
      where: {
        recipientId: req.user.id,
        isRead: true
      }
    });

    res.json({
      success: true,
      message: 'All read notifications deleted successfully'
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete read notifications',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications
};

