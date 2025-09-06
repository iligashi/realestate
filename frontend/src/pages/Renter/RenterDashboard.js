import React, { useEffect, useState } from 'react';
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
import SavedSearches from '../../components/Buyer/SavedSearches';
import ViewingScheduler from '../../components/Buyer/ViewingScheduler';
import MortgageCalculator from '../../components/Buyer/MortgageCalculator';
import PropertyAlerts from '../../components/Buyer/PropertyAlerts';
import RentalApplicationManagement from '../../components/Renter/RentalApplicationManagement';

const RenterDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user = null } = useSelector(state => state.auth || {});
  
  const [activeTab, setActiveTab] = useState('browse');

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
    { id: 'saved-searches', name: 'Saved Searches', icon: MagnifyingGlassIcon, description: 'Manage search alerts' },
    { id: 'viewings', name: 'Viewings', icon: CalendarIcon, description: 'Schedule property viewings' },
    { id: 'calculator', name: 'Rent Calculator', icon: CalculatorIcon, description: 'Calculate rental costs' },
    { id: 'alerts', name: 'Property Alerts', icon: BellIcon, description: 'New listing notifications' },
    { id: 'applications', name: 'Rental Applications', icon: DocumentTextIcon, description: 'Manage rental applications' },
    { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon, description: 'Chat with landlords' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'All notifications' },
    { id: 'my-rentals', name: 'My Rentals', icon: BuildingOfficeIcon, description: 'Manage my rental properties' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wishlist':
        return <WishlistManager />;
      case 'compare':
        return <PropertyComparison />;
      case 'saved-searches':
        return <SavedSearches />;
      case 'viewings':
        return <ViewingScheduler />;
      case 'calculator':
        return <MortgageCalculator />;
      case 'alerts':
        return <PropertyAlerts />;
      case 'applications':
        return <RentalApplicationManagement />;
      case 'messages':
        return <div className="p-6 text-center text-gray-500">Messages feature coming soon...</div>;
      case 'notifications':
        return <div className="p-6 text-center text-gray-500">Notifications feature coming soon...</div>;
      case 'my-rentals':
        return <div className="p-6 text-center text-gray-500">My Rentals feature coming soon...</div>;
      default:
        return <div className="p-6 text-center text-gray-500">Select a tab to get started</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Renter Dashboard</h1>
              <p className="mt-2 text-gray-600">Find and manage your perfect rental properties</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/properties')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Browse Properties
              </button>
              <button
                onClick={() => navigate('/properties/create-rental')}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 font-medium flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                List Property for Rent
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-lg font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
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
