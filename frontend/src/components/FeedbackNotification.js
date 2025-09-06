import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const FeedbackNotification = ({ 
  type, // 'success', 'error', 'warning', 'info'
  title,
  message,
  duration = 5000,
  onClose,
  show = true
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out";
    
    if (isExiting) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    const typeStyles = {
      success: "border-green-500",
      error: "border-red-500", 
      warning: "border-yellow-500",
      info: "border-blue-500"
    };
    
    return `${baseStyles} translate-x-0 opacity-100 ${typeStyles[type] || typeStyles.info}`;
  };

  if (!isVisible) return null;

  return (
    <div className={getStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium text-gray-900">
                {title}
              </p>
            )}
            <p className={`text-sm ${title ? 'mt-1' : ''} text-gray-600`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for managing feedback notifications
export const useFeedbackNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      show: true
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };

  const hideNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (title, message, duration = 5000) => {
    return showNotification({ type: 'success', title, message, duration });
  };

  const showError = (title, message, duration = 7000) => {
    return showNotification({ type: 'error', title, message, duration });
  };

  const showWarning = (title, message, duration = 6000) => {
    return showNotification({ type: 'warning', title, message, duration });
  };

  const showInfo = (title, message, duration = 5000) => {
    return showNotification({ type: 'info', title, message, duration });
  };

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <FeedbackNotification
          key={notification.id}
          {...notification}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </div>
  );

  return {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    NotificationContainer
  };
};

export default FeedbackNotification;
