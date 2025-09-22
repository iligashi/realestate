import React, { useState, useEffect } from 'react';
import { 
  BellIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
  MarkAsReadIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  HeartIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'property_alert',
      title: 'New Property Match',
      message: '3 new properties match your "Downtown Condos" alert',
      timestamp: '2024-01-15T10:30:00Z',
      isRead: false,
      priority: 'high',
      actionUrl: '/buyer?tab=browse&alert=1',
      metadata: {
        alertName: 'Downtown Condos',
        propertyCount: 3
      }
    },
    {
      id: 2,
      type: 'message_reply',
      title: 'New Message from Seller',
      message: 'John Smith replied to your message about Modern Downtown Condo',
      timestamp: '2024-01-15T09:15:00Z',
      isRead: false,
      priority: 'medium',
      actionUrl: '/buyer?tab=messages',
      metadata: {
        sellerName: 'John Smith',
        propertyTitle: 'Modern Downtown Condo'
      }
    },
    {
      id: 3,
      type: 'viewing_reminder',
      title: 'Viewing Reminder',
      message: 'You have a property viewing scheduled for tomorrow at 2:00 PM',
      timestamp: '2024-01-14T16:45:00Z',
      isRead: true,
      priority: 'medium',
      actionUrl: '/buyer?tab=viewings',
      metadata: {
        propertyTitle: 'Family Home in Suburbs',
        scheduledTime: '2024-01-16T14:00:00Z'
      }
    },
    {
      id: 4,
      type: 'price_drop',
      title: 'Price Drop Alert',
      message: 'Luxury Penthouse price dropped by $50,000',
      timestamp: '2024-01-14T14:20:00Z',
      isRead: true,
      priority: 'high',
      actionUrl: '/properties/prop3',
      metadata: {
        propertyTitle: 'Luxury Penthouse',
        priceDrop: 50000,
        newPrice: 950000
      }
    },
    {
      id: 5,
      type: 'system',
      title: 'Welcome to Real Estate Platform',
      message: 'Complete your profile to get personalized property recommendations',
      timestamp: '2024-01-10T08:00:00Z',
      isRead: true,
      priority: 'low',
      actionUrl: '/profile',
      metadata: {}
    }
  ]);

  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    if (filterRead === 'read' && !notification.isRead) return false;
    if (filterRead === 'unread' && notification.isRead) return false;
    return true;
  });

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
    toast.success('Notification marked as read');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    toast.success('Notification deleted');
  };

  const handleDeleteAllRead = () => {
    setNotifications(prev => prev.filter(notification => !notification.isRead));
    toast.success('All read notifications deleted');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'property_alert':
        return <BellIcon className="h-5 w-5" />;
      case 'message_reply':
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      case 'viewing_reminder':
        return <CalendarIcon className="h-5 w-5" />;
      case 'price_drop':
        return <HomeIcon className="h-5 w-5" />;
      case 'system':
        return <InformationCircleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'property_alert': return 'bg-blue-100 text-blue-600';
      case 'message_reply': return 'bg-green-100 text-green-600';
      case 'viewing_reminder': return 'bg-purple-100 text-purple-600';
      case 'price_drop': return 'bg-orange-100 text-orange-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NotificationCard = ({ notification }) => (
    <div className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300 ${
      !notification.isRead ? 'border-l-4 border-blue-500' : ''
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
                <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </span>
                {!notification.isRead && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    New
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                  title="Mark as read"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => window.open(notification.actionUrl, '_blank')}
                className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50"
                title="View details"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                title="Delete notification"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Mark All Read
            </button>
          )}
          <button
            onClick={handleDeleteAllRead}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="property_alert">Property Alerts</option>
            <option value="message_reply">Messages</option>
            <option value="viewing_reminder">Viewings</option>
            <option value="price_drop">Price Drops</option>
            <option value="system">System</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterType === 'all' && filterPriority === 'all' && filterRead === 'all'
              ? 'You have no notifications yet.'
              : 'No notifications match your current filters.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
