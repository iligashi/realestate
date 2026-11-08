import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useWebSocket from '../../hooks/useWebSocket';
import { 
  HomeIcon, 
  HeartIcon, 
  ScaleIcon, 
  BellIcon, 
  CalendarIcon,
  CalculatorIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PlusIcon,
  BuildingOfficeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ErrorBoundary from '../../components/ErrorBoundary';

// Import components (we'll create these)
import WishlistManager from '../../components/Buyer/WishlistManager';
import PropertyComparison from '../../components/Buyer/PropertyComparison';
import ViewingScheduler from '../../components/Buyer/ViewingScheduler';
import RenterApplicationManagement from '../../components/Renter/RenterApplicationManagement';
import RenterMessages from '../../components/Renter/RenterMessages';
import MyRentalListings from '../../components/Renter/MyRentalListings';
import RentCalculator from '../../components/Renter/RentCalculator';

const RenterDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user = null } = useSelector(state => state.auth || {});
  
  const [activeTab, setActiveTab] = useState('wishlist');

  // WebSocket integration for real-time features
  useWebSocket();

  // Handle tab parameter from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'wishlist', name: 'Wishlist', icon: HeartIcon, description: 'Manage saved properties' },
    { id: 'compare', name: 'Compare', icon: ScaleIcon, description: 'Compare properties side by side' },
    { id: 'viewings', name: 'Viewings', icon: CalendarIcon, description: 'Schedule property viewings' },
    { id: 'calculator', name: 'Rent Calculator', icon: CalculatorIcon, description: 'Calculate rental costs' },
    { id: 'applications', name: 'Rental Applications', icon: DocumentTextIcon, description: 'Manage rental applications' },
    { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon, description: 'Chat with landlords' },
    { id: 'listings', name: 'My listings', icon: BuildingOfficeIcon, description: 'Rentals you have posted' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wishlist':
        return <WishlistManager />;
      case 'compare':
        return <PropertyComparison />;
      case 'viewings':
        return <ViewingScheduler />;
      case 'calculator':
        return <RentCalculator />;
      case 'applications':
        return <RenterApplicationManagement />;
      case 'messages':
        return <RenterMessages />;
      case 'listings':
        return <MyRentalListings />;
      default:
        return <div className="p-6 text-center text-gray-500">Select a tab to get started</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-12 w-12 shrink-0 bg-green-600 rounded-full items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Renter Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Find and manage your rentals.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <button
              onClick={() => navigate('/properties')}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <HomeIcon className="h-5 w-5" />
              Browse
            </button>
            <button
              onClick={() => navigate('/properties/create-rental')}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              List a rental
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex gap-6 px-4 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center group`}
                    title={tab.description}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          <ErrorBoundary>
            {renderTabContent()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
