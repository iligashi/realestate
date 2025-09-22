import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  EyeIcon,
  HeartIcon,
  CalendarIcon,
  DocumentTextIcon,
  CameraIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  PhotoIcon,
  HomeModernIcon,
  UsersIcon,
  TrendingUpIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '../../hooks/useWebSocket';
import ClientManagement from '../../components/Agent/ClientManagement';

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user = null } = useSelector(state => state.auth || {});
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WebSocket integration for real-time features
  useWebSocket();

  // Handle tab parameter from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/agent/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.userType === 'agent') {
      fetchDashboardData();
    }
  }, [user]);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, description: 'Overview and analytics' },
    { id: 'clients', name: 'Clients', icon: UserGroupIcon, description: 'Manage client relationships' },
    { id: 'leads', name: 'Leads', icon: MegaphoneIcon, description: 'Lead generation and nurturing' },
    { id: 'commissions', name: 'Commissions', icon: CurrencyDollarIcon, description: 'Track earnings and payments' },
    { id: 'properties', name: 'Properties', icon: BuildingOfficeIcon, description: 'Manage property listings' },
    { id: 'marketing', name: 'Marketing', icon: PresentationChartLineIcon, description: 'Property marketing tools' },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, description: 'Market analysis and reports' },
    { id: 'open-houses', name: 'Open Houses', icon: HomeModernIcon, description: 'Schedule and manage open houses' },
    { id: 'photography', name: 'Photography', icon: PhotoIcon, description: 'Property photography services' },
    { id: 'profile', name: 'Profile', icon: UsersIcon, description: 'Professional profile and reviews' },
    { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon, description: 'Client communications' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'Alerts and updates' }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'clients':
        return renderClients();
      case 'leads':
        return renderLeads();
      case 'commissions':
        return renderCommissions();
      case 'properties':
        return renderProperties();
      case 'marketing':
        return renderMarketing();
      case 'analytics':
        return renderAnalytics();
      case 'open-houses':
        return renderOpenHouses();
      case 'photography':
        return renderPhotography();
      case 'profile':
        return renderProfile();
      case 'messages':
        return renderMessages();
      case 'notifications':
        return renderNotifications();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;

    const { stats, recentActivities, monthlyCommissions, recentReviews } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalClients}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MegaphoneIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Leads</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeLeads}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Commissions</dt>
                    <dd className="text-lg font-medium text-gray-900">${stats.totalCommissions.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Listings</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeListings}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Commissions Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Commissions</h3>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Chart will be implemented here</p>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reviews</h3>
            <div className="space-y-4">
              {recentReviews && recentReviews.length > 0 ? (
                recentReviews.map((review, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {review.reviewerId?.firstName?.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {review.reviewerId?.firstName} {review.reviewerId?.lastName}
                      </p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent reviews</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('clients')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <UserGroupIcon className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Client</span>
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <MegaphoneIcon className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Lead</span>
            </button>
            <button
              onClick={() => navigate('/properties/create')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <PlusIcon className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">New Listing</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ChartBarIcon className="h-8 w-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Market Analysis</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderClients = () => <ClientManagement />;

  const renderLeads = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Add New Lead
        </button>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Lead management interface will be implemented here</p>
      </div>
    </div>
  );

  const renderCommissions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Commission Tracking</h2>
        <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
          Add Commission
        </button>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Commission tracking interface will be implemented here</p>
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          Add Property
        </button>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Property management interface will be implemented here</p>
      </div>
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Property Marketing Tools</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Marketing tools interface will be implemented here</p>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Market Analysis & Reports</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Analytics interface will be implemented here</p>
      </div>
    </div>
  );

  const renderOpenHouses = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Open House Management</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Open house management interface will be implemented here</p>
      </div>
    </div>
  );

  const renderPhotography = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Property Photography Services</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Photography services interface will be implemented here</p>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Professional Profile</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Professional profile interface will be implemented here</p>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Client Communications</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Messages interface will be implemented here</p>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Notifications interface will be implemented here</p>
      </div>
    </div>
  );

  if (!user || user.userType !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You need to be an agent to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user.firstName}! Manage your clients, track commissions, and grow your business.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AgentDashboard;
