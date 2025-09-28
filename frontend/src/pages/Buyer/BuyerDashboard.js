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
  DocumentTextIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ErrorBoundary from '../../components/ErrorBoundary';

// Import components
import WishlistManager from '../../components/Buyer/WishlistManager';
import PropertyComparison from '../../components/Buyer/PropertyComparison';
import SavedSearches from '../../components/Buyer/SavedSearches';
import ViewingScheduler from '../../components/Buyer/ViewingScheduler';
import MortgageCalculator from '../../components/Buyer/MortgageCalculator';
import PropertyAlerts from '../../components/Buyer/PropertyAlerts';
import BuyerMessages from '../../components/Buyer/BuyerMessages';
import NotificationCenter from '../../components/Buyer/NotificationCenter';
import ApplicantApplicationStatus from '../../components/ApplicantApplicationStatus';
import UserReports from '../../components/Buyer/UserReports';

const BuyerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user = null } = useSelector(state => state.auth || {});
  
  const [activeTab, setActiveTab] = useState('wishlist');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // WebSocket integration for real-time features
  useWebSocket();

  // Handle tab parameter from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  const tabs = [
    { id: 'wishlist', name: 'Wishlist', icon: HeartIcon, description: 'Manage saved properties', priority: 'high' },
    { id: 'applications', name: 'My Applications', icon: DocumentTextIcon, description: 'Track rental applications', priority: 'high' },
    { id: 'viewings', name: 'Viewings', icon: CalendarIcon, description: 'Schedule property viewings', priority: 'high' },
    { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon, description: 'Chat with sellers', priority: 'high' },
    { id: 'reports', name: 'Reports', icon: ExclamationTriangleIcon, description: 'View reports against you', priority: 'medium' },
    { id: 'compare', name: 'Compare', icon: ScaleIcon, description: 'Compare properties side by side', priority: 'low' },
    { id: 'saved-searches', name: 'Saved Searches', icon: MagnifyingGlassIcon, description: 'Manage search alerts', priority: 'low' },
    { id: 'calculator', name: 'Mortgage Calculator', icon: CalculatorIcon, description: 'Calculate mortgage payments', priority: 'low' },
    { id: 'alerts', name: 'Property Alerts', icon: BellIcon, description: 'New listing notifications', priority: 'low' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'All notifications', priority: 'low' }
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
        return <ApplicantApplicationStatus />;
      case 'messages':
        return <BuyerMessages />;
      case 'notifications':
        return <NotificationCenter />;
      case 'reports':
        return <UserReports />;
      default:
        return <WishlistManager />;
    }
  };

  // Separate tabs by priority for better organization
  const highPriorityTabs = tabs.filter(tab => tab.priority === 'high');
  const mediumPriorityTabs = tabs.filter(tab => tab.priority === 'medium');
  const lowPriorityTabs = tabs.filter(tab => tab.priority === 'low');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.firstName}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/properties')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              Browse
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
              <p className="mt-2 text-gray-600">Find your perfect home with our comprehensive tools</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/properties')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Browse Properties
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-lg font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Mobile Navigation Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-gray-600 bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
              <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <div>
                            <div className="font-medium">{tab.name}</div>
                            <div className="text-sm text-gray-500">{tab.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <div className="p-6">
              <nav className="space-y-2">
                {/* High Priority Tabs */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Features</h3>
                  {highPriorityTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <div>
                          <div className="font-medium">{tab.name}</div>
                          <div className="text-sm text-gray-500">{tab.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Medium Priority Tabs */}
                {mediumPriorityTabs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
                    {mediumPriorityTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <div>
                            <div className="font-medium">{tab.name}</div>
                            <div className="text-sm text-gray-500">{tab.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Low Priority Tabs */}
                {lowPriorityTabs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tools</h3>
                    {lowPriorityTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <div>
                            <div className="font-medium">{tab.name}</div>
                            <div className="text-sm text-gray-500">{tab.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-screen">
            <div className="h-full bg-white">
              <ErrorBoundary>
                {renderTabContent()}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
