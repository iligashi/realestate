import React from 'react';
import { useSelector } from 'react-redux';

const SessionDebug = () => {
  const { token, isAuthenticated, user, sessionInitialized, loading } = useSelector((state) => state.auth);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div className="space-y-1">
        <div>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
        <div>Session Initialized: {sessionInitialized ? 'Yes' : 'No'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>LocalStorage Token: {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default SessionDebug;
