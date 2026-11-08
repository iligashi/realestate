import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Listing pages: sellers, agents and admins by default. Pass `roles` to widen it.
const SellerRoute = ({ children, roles = ['seller', 'agent', 'admin'] }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <ProtectedRoute>
      {roles.includes(user?.userType) ? (
        children
      ) : (
        <Navigate to="/dashboard" replace />
      )}
    </ProtectedRoute>
  );
};

export default SellerRoute;
