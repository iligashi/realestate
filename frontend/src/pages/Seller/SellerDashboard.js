import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  getSellerDashboard, 
  setActiveTab,
  clearError 
} from '../../store/slices/sellerSlice';
import useWebSocket from '../../hooks/useWebSocket';
import { 
  HomeIcon, 
  PlusIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  BellIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import ErrorBoundary from '../../components/ErrorBoundary';

// Import components
import PropertyListingWizard from '../../components/Seller/PropertyListingWizard';
import Inbox from '../../components/Seller/Inbox';
import AnalyticsDashboard from '../../components/Seller/AnalyticsDashboard';
import UserReports from '../../components/Buyer/UserReports';
import NotificationCenter from '../../components/Buyer/NotificationCenter';

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    dashboard, 
    loading, 
    error, 
    activeTab 
  } = useSelector(state => state.seller);
  const { user } = useSelector(state => state.auth);
  
  const [showPropertyWizard, setShowPropertyWizard] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // WebSocket integration for real-time features
  useWebSocket();

  useEffect(() => {
    dispatch(getSellerDashboard());
  }, [dispatch]);

  // Handle tab parameter from URL on initial load
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      dispatch(setActiveTab(tabFromUrl));
    }
  }, [searchParams, dispatch]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, description: 'Overview and quick stats', priority: 'high' },
    { id: 'properties', name: 'My Properties', icon: BuildingOfficeIcon, description: 'Manage property listings', priority: 'high' },
    { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon, description: 'Communicate with buyers', priority: 'high' },
    { id: 'inquiries', name: 'Inquiries', icon: ClipboardDocumentListIcon, description: 'Manage property inquiries', priority: 'high' },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, description: 'Track performance metrics', priority: 'medium' },
    { id: 'reports', name: 'Reports', icon: ExclamationTriangleIcon, description: 'View reports and moderation', priority: 'medium' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'System notifications', priority: 'low' },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, description: 'Account and preferences', priority: 'low' }
  ];

  const handleTabChange = (tabId) => {
    dispatch(setActiveTab(tabId));
    setSearchParams({ tab: tabId });
  };

  const getWorkflowStageColor = (stage) => {
    switch (stage) {
      case 'List': return 'bg-gray-100 text-gray-800';
      case 'Market': return 'bg-blue-100 text-blue-800';
      case 'Show': return 'bg-yellow-100 text-yellow-800';
      case 'Negotiate': return 'bg-orange-100 text-orange-800';
      case 'Close': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowStageIcon = (stage) => {
    switch (stage) {
      case 'List': return '📝';
      case 'Market': return '📢';
      case 'Show': return '👀';
      case 'Negotiate': return '🤝';
      case 'Close': return '✅';
      default: return '📝';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'properties':
        return <PropertiesManagement />;
      case 'messages':
        return <Inbox />;
      case 'inquiries':
        return <InquiriesManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'reports':
        return <UserReports />;
      case 'notifications':
        return <NotificationCenter />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardOverview />;
    }
  };

  // Separate tabs by priority for better organization
  const highPriorityTabs = tabs.filter(tab => tab.priority === 'high');
  const mediumPriorityTabs = tabs.filter(tab => tab.priority === 'medium');
  const lowPriorityTabs = tabs.filter(tab => tab.priority === 'low');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <HomeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Seller Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.firstName}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                <p className="text-gray-600">Manage your properties and track performance</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowPropertyWizard(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                <span>New Listing</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Mobile Navigation Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-gray-600 bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
              <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <nav className="p-4 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          handleTabChange(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
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
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <div className="p-6">
              <nav className="space-y-2">
                {/* High Priority Tabs */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main</h3>
                  {highPriorityTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
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
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Analytics</h3>
                    {mediumPriorityTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
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
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Settings</h3>
                    {lowPriorityTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
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

      {/* Property Listing Wizard Modal */}
      {showPropertyWizard && (
        <PropertyListingWizard onClose={() => setShowPropertyWizard(false)} />
      )}
    </div>
  );

  // Dashboard Overview Component
  function DashboardOverview() {
    return (
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Properties</p>
                <p className="text-3xl font-bold text-blue-900">{dashboard?.stats?.totalProperties || 0}</p>
                <p className="text-xs text-blue-600 mt-1">Active listings</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-green-900">{dashboard?.stats?.totalViews?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600 mt-1">This month</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <EyeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">Inquiries</p>
                <p className="text-3xl font-bold text-yellow-900">{dashboard?.stats?.totalInquiries || 0}</p>
                <p className="text-xs text-yellow-600 mt-1">New messages</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Favorites</p>
                <p className="text-3xl font-bold text-red-900">{dashboard?.stats?.totalSaves || 0}</p>
                <p className="text-xs text-red-600 mt-1">Property saves</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowPropertyWizard(true)}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
            >
              <div className="bg-blue-500 p-2 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors">
                <PlusIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Add New Property</p>
                <p className="text-sm text-gray-600">Create a new listing</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleTabChange('messages')}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
            >
              <div className="bg-green-500 p-2 rounded-lg mr-3 group-hover:bg-green-600 transition-colors">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View Messages</p>
                <p className="text-sm text-gray-600">Check messages</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleTabChange('analytics')}
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
            >
              <div className="bg-purple-500 p-2 rounded-lg mr-3 group-hover:bg-purple-600 transition-colors">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Track performance</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Properties</h3>
            <button 
              onClick={() => handleTabChange('properties')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              View All
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard?.properties?.slice(0, 4).map((property, index) => (
              <div key={property.id || property._id || `property-${index}`} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {typeof property.address === 'string' ? 
                        (() => {
                          try {
                            const addr = JSON.parse(property.address);
                            return `${addr.city || ''}, ${addr.state || ''}`;
                          } catch (e) {
                            return property.address;
                          }
                        })() : 
                        `${property.address?.city || ''}, ${property.address?.state || ''}`
                      }
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${property.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getWorkflowStageColor(property.workflowStage)}`}>
                      <span className="mr-1">{getWorkflowStageIcon(property.workflowStage)}</span>
                      {property.workflowStage}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{property.daysOnMarket || 0} days on market</span>
                  <div className="flex items-center space-x-6">
                    <span className="flex items-center text-gray-600">
                      <EyeIcon className="h-4 w-4 mr-1 text-blue-500" />
                      {property.analytics?.views || 0} views
                    </span>
                    <span className="flex items-center text-gray-600">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 text-green-500" />
                      {property.analytics?.inquiries || 0} messages
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Properties Management Component
  function PropertiesManagement() {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
            <p className="text-gray-600 mt-1">Manage and track your property listings</p>
          </div>
          <button 
            onClick={() => setShowPropertyWizard(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add New Property</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {dashboard?.properties?.map((property, index) => (
            <div key={property.id || property._id || `property-${index}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-56 bg-gray-200 relative">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={property.photos[0].url}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getWorkflowStageColor(property.workflowStage)}`}>
                    <span className="mr-1">{getWorkflowStageIcon(property.workflowStage)}</span>
                    {property.workflowStage}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                <p className="text-gray-600 mb-3">
                  {typeof property.address === 'string' ? 
                    (() => {
                      try {
                        const addr = JSON.parse(property.address);
                        return `${addr.city || ''}, ${addr.state || ''}`;
                      } catch (e) {
                        return property.address;
                      }
                    })() : 
                    `${property.address?.city || ''}, ${property.address?.state || ''}`
                  }
                </p>
                <p className="text-2xl font-bold text-blue-600 mb-4">
                  ${property.price?.toLocaleString() || '0'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <span>{property.daysOnMarket || 0} days on market</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1 text-blue-500" />
                      {property.analytics?.views || 0}
                    </span>
                    <span className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 text-green-500" />
                      {property.analytics?.inquiries || 0} messages
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                      const propertyId = property.id || property._id;
                      if (propertyId) {
                        navigate(`/properties/${propertyId}/edit`);
                      } else {
                        alert('Property ID not available. Please refresh the page.');
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Edit Property
                  </button>
                  <button 
                    onClick={() => {
                      const propertyId = property.id || property._id;
                      if (propertyId) {
                        navigate(`/properties/${propertyId}`);
                      } else {
                        alert('Property ID not available. Please refresh the page.');
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200"
                  >
<<<<<<< Updated upstream
                    View All
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboard.properties.slice(0, 4).map((property) => (
                    <div key={property._id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {property.address.city}, {property.address.state}
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${property.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getWorkflowStageColor(property.workflowStage)}`}>
                            <span className="mr-1">{getWorkflowStageIcon(property.workflowStage)}</span>
                            {property.workflowStage}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{property.daysOnMarket} days on market</span>
                        <div className="flex items-center space-x-6">
                          <span className="flex items-center text-gray-600">
                            <EyeIcon className="h-4 w-4 mr-1 text-blue-500" />
                            {property.analytics?.views || 0} views
                          </span>
                          <span className="flex items-center text-gray-600">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 text-green-500" />
                            {property.analytics?.inquiries || 0} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modern Recent Messages */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Messages</h3>
                  <button 
                    onClick={() => handleTabChange('inbox')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                  >
                    View All Messages
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  {dashboard.recentActivity.slice(0, 5).map((inquiry) => (
                    <div key={inquiry._id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">
                                {inquiry.buyer?.firstName?.[0]}{inquiry.buyer?.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-lg font-semibold text-gray-900">
                              {inquiry.buyer?.firstName} {inquiry.buyer?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{inquiry.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {new Date(inquiry.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            inquiry.status === 'new' ? 'bg-red-100 text-red-800' :
                            inquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                            inquiry.status === 'responded' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inquiry.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
                  <p className="text-gray-600 mt-1">Manage and track your property listings</p>
                </div>
                <button 
                  onClick={() => setShowPropertyWizard(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 font-medium"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add New Property</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {dashboard.properties.map((property) => (
                  <div key={property._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    {property.photos && property.photos.length > 0 && (
                      <div className="h-56 bg-gray-200 relative">
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getWorkflowStageColor(property.workflowStage)}`}>
                            <span className="mr-1">{getWorkflowStageIcon(property.workflowStage)}</span>
                            {property.workflowStage}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                      <p className="text-gray-600 mb-3">
                        {property.address.city}, {property.address.state}
                      </p>
                      <p className="text-2xl font-bold text-blue-600 mb-4">
                        ${property.price.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        <span>{property.daysOnMarket} days on market</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1 text-blue-500" />
                            {property.analytics?.views || 0}
                          </span>
                          <span className="flex items-center">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 text-green-500" />
                            {property.analytics?.inquiries || 0} messages
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => navigate(`/properties/${property._id}/edit`)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Edit Property
                        </button>
                        <button 
                          onClick={() => navigate(`/properties/${property._id}`)}
                          className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Messages & Inbox</h2>
                <p className="text-gray-600 mt-1">Communicate with potential buyers and manage messages</p>
              </div>
              <ErrorBoundary>
                <Inbox />
              </ErrorBoundary>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                <p className="text-gray-600 mt-1">Track your property performance and market insights</p>
              </div>
              <ErrorBoundary>
                <AnalyticsDashboard />
              </ErrorBoundary>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pricing Management</h2>
                <p className="text-gray-600 mt-1">Manage your property prices and track price changes</p>
              </div>
              <div className="text-center py-16">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-12 max-w-md mx-auto">
                  <CurrencyDollarIcon className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Price Management</h3>
                  <p className="text-gray-600 mb-6">
                    Advanced pricing tools and market analysis coming soon.
                  </p>
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Learn More
=======
>>>>>>> Stashed changes
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Inquiries Management Component
  function InquiriesManagement() {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Property Inquiries</h2>
          <p className="text-gray-600 mt-1">Manage inquiries and messages from potential buyers</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Inquiries Management</h3>
            <p className="mt-1 text-sm text-gray-500">This feature will be available soon.</p>
          </div>
        </div>
      </div>
    );
  }

  // Settings Panel Component
  function SettingsPanel() {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Settings Panel</h3>
            <p className="mt-1 text-sm text-gray-500">This feature will be available soon.</p>
          </div>
        </div>
      </div>
    );
  }
};

export default SellerDashboard;