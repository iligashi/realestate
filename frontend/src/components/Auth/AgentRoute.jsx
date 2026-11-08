import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const AgentRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <ProtectedRoute>
      {user?.userType === 'agent' || user?.userType === 'admin' ? children : <Navigate to="/dashboard" replace />}
    </ProtectedRoute>
  );
};

export default AgentRoute;
