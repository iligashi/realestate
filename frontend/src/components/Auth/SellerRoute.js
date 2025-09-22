import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const SellerRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <ProtectedRoute>
      {user?.userType === 'seller' || user?.userType === 'agent' || user?.userType === 'admin' ? (
        children
      ) : (
        <Navigate to="/dashboard" replace />
      )}
    </ProtectedRoute>
  );
};

export default SellerRoute;
