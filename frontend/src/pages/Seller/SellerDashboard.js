import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  getSellerDashboard, 
  setActiveTab,
  clearError 
} from '../../store/slices/sellerSlice';
import { 
  HomeIcon, 
  PlusIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import PropertyListingWizard from '../../components/Seller/PropertyListingWizard';
import Inbox from '../../components/Seller/Inbox';
import AnalyticsDashboard from '../../components/Seller/AnalyticsDashboard';
import ErrorBoundary from '../../components/ErrorBoundary';

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

  useEffect(() => {
    dispatch(getSellerDashboard());
  }, [dispatch]);

  // Handle tab parameter from URL on initial load
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      dispatch(setActiveTab(tabFromUrl));
    }
  }, [searchParams, dispatch]); // Removed activeTab from dependencies to avoid loops

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'properties', name: 'My Properties', icon: PlusIcon },
    { id: 'inbox', name: 'Inbox', icon: ChatBubbleLeftRightIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'pricing', name: 'Pricing', icon: CurrencyDollarIcon }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage your property empire and track your success
                </p>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Modern Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Properties Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Properties</p>
                <p className="text-3xl font-bold text-blue-900">{dashboard.stats.totalProperties}</p>
                <p className="text-xs text-blue-600 mt-1">Active listings</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Views Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-green-900">{dashboard.stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">This month</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <EyeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Inbox Messages Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">Total Inbox Messages</p>
                <p className="text-3xl font-bold text-yellow-900">{dashboard.stats.totalInquiries}</p>
                <p className="text-xs text-yellow-600 mt-1">Unread messages</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Saves Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Total Saves</p>
                <p className="text-3xl font-bold text-red-900">{dashboard.stats.totalSaves}</p>
                <p className="text-xs text-red-600 mt-1">Favorites</p>
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
              onClick={() => handleTabChange('inbox')}
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

        {/* Modern Navigation Tabs */}
        <div className="bg-white shadow-xl rounded-2xl mb-8 border border-gray-100">
          <div className="px-6 py-2">
            <nav className="flex space-x-1" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    } px-6 py-3 rounded-xl font-medium text-sm flex items-center transition-all duration-200 transform hover:scale-105`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Modern Tab Content */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
          {activeTab === 'dashboard' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                  <p className="text-gray-600 mt-1">Monitor your property performance and recent activity</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowPropertyWizard(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Property</span>
                  </button>
                </div>
              </div>
              
              {/* Modern Properties Overview */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Your Properties</h3>
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
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Listing Wizard Modal */}
      {showPropertyWizard && (
        <PropertyListingWizard onClose={() => setShowPropertyWizard(false)} />
      )}
    </div>
  );
};

export default SellerDashboard;
