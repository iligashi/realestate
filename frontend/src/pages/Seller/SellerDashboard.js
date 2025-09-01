import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getSellerDashboard, 
  setActiveTab,
  clearError 
} from '../../store/slices/sellerSlice';
import { 
  HomeIcon, 
  PlusIcon, 
  InboxIcon, 
  ChartBarIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import PropertyListingWizard from '../../components/Seller/PropertyListingWizard';
import InquiryManagement from '../../components/Seller/InquiryManagement';
import AnalyticsDashboard from '../../components/Seller/AnalyticsDashboard';
import OpenHouseManagement from '../../components/Seller/OpenHouseManagement';

const SellerDashboard = () => {
  const dispatch = useDispatch();
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
    { id: 'inquiries', name: 'Inquiries', icon: InboxIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'open-houses', name: 'Open Houses', icon: CalendarIcon },
    { id: 'pricing', name: 'Pricing', icon: CurrencyDollarIcon }
  ];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your property listings and track your sales performance
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowPropertyWizard(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 inline mr-2" />
                New Listing
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Properties
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.stats.totalProperties}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Views
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.stats.totalViews.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Inquiries
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.stats.totalInquiries}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HeartIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Saves
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.stats.totalSaves}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => dispatch(setActiveTab(tab.id))}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
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
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h2>
              
              {/* Properties Overview */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-900 mb-4">Your Properties</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboard.properties.slice(0, 4).map((property) => (
                    <div key={property._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{property.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {property.address.city}, {property.address.state}
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mt-2">
                            ${property.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkflowStageColor(property.workflowStage)}`}>
                            <span className="mr-1">{getWorkflowStageIcon(property.workflowStage)}</span>
                            {property.workflowStage}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>{property.daysOnMarket} days on market</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {property.analytics?.views || 0}
                          </span>
                          <span className="flex items-center">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            {property.analytics?.inquiries || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Inquiries */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Recent Inquiries</h3>
                <div className="space-y-4">
                  {dashboard.recentActivity.slice(0, 5).map((inquiry) => (
                    <div key={inquiry._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {inquiry.buyer?.firstName?.[0]}{inquiry.buyer?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {inquiry.buyer?.firstName} {inquiry.buyer?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{inquiry.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inquiry.status === 'new' ? 'bg-red-100 text-red-800' :
                          inquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                          inquiry.status === 'responded' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inquiry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">My Properties</h2>
                <button 
                  onClick={() => setShowPropertyWizard(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 inline mr-2" />
                  Add New Property
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {dashboard.properties.map((property) => (
                  <div key={property._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {property.photos && property.photos.length > 0 && (
                      <div className="h-48 bg-gray-200">
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{property.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkflowStageColor(property.workflowStage)}`}>
                          <span className="mr-1">{getWorkflowStageIcon(property.workflowStage)}</span>
                          {property.workflowStage}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {property.address.city}, {property.address.state}
                      </p>
                      <p className="text-xl font-semibold text-gray-900 mb-4">
                        ${property.price.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{property.daysOnMarket} days on market</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {property.analytics?.views || 0}
                          </span>
                          <span className="flex items-center">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            {property.analytics?.inquiries || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors">
                          Edit
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-200 transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="p-6">
              <InquiryManagement />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6">
              <AnalyticsDashboard />
            </div>
          )}

          {activeTab === 'open-houses' && (
            <div className="p-6">
              <OpenHouseManagement />
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Pricing</h2>
              <div className="text-center py-12">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Price management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your property prices and track price changes.
                </p>
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
