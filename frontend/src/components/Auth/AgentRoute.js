import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const AgentRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && user.userType !== 'agent') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AgentRoute;
