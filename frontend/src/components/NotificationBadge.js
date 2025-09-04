import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUnreadCount } from '../store/slices/messageSlice';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationBadge = ({ className = "" }) => {
  const dispatch = useDispatch();
  const { unreadCount } = useSelector(state => state.messages);
  const { isAuthenticated } = useSelector(state => state.auth);

  // Fetch unread count when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUnreadCount());
    }
  }, [dispatch, isAuthenticated]);

  // Auto-refresh unread count every 10 seconds (throttled)
  useEffect(() => {
    if (!isAuthenticated) return;

    let alive = true;
    const interval = setInterval(() => {
      if (!alive) return;
      dispatch(getUnreadCount());
    }, 10000); // 10 seconds

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated || unreadCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <BellIcon className="h-6 w-6 text-gray-600" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
};

export default NotificationBadge;
