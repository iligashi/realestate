import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

// Every role has its own dashboard; /dashboard just sends you to yours.
export const DASHBOARD_FOR = {
  admin: '/admin',
  agent: '/agent',
  seller: '/seller',
  renter: '/renter',
  buyer: '/buyer'
};

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  return <Navigate to={DASHBOARD_FOR[user?.userType] || '/buyer'} replace />;
};

export default DashboardPage;
