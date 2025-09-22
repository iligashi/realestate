import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  HomeModernIcon, 
  BuildingOffice2Icon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();

  const getRoleDisplayName = (userType) => {
    const roleNames = {
      admin: 'Administrator',
      agent: 'Real Estate Agent',
      buyer: 'Property Buyer',
      seller: 'Property Seller',
      renter: 'Property Renter'
    };
    return roleNames[userType] || userType;
  };

  const getWelcomeMessage = (userType) => {
    switch (userType) {
      case 'buyer':
        return "Find your dream property today!";
      case 'seller':
        return "Manage your property listings and grow your business!";
      case 'agent':
        return "Connect buyers and sellers in your market!";
      case 'renter':
        return "Discover the perfect rental property!";
      case 'admin':
        return "Manage the platform and oversee operations!";
      default:
        return "Welcome to your real estate dashboard!";
    }
  };

  const getQuickActions = (userType) => {
    const baseActions = [
      {
        name: 'Browse Properties',
        description: 'Explore all available properties',
        href: '/properties',
        icon: HomeIcon,
        color: 'blue'
      }
    ];

    switch (userType) {
      case 'buyer':
        return [
          ...baseActions,
          {
            name: 'My Wishlist',
            description: 'View saved properties',
            href: '/buyer?tab=wishlist',
            icon: HeartIcon,
            color: 'red'
          },
          {
            name: 'My Messages',
            description: 'Chat with sellers',
            href: '/buyer?tab=messages',
            icon: ChatBubbleLeftRightIcon,
            color: 'green'
          }
        ];
      case 'seller':
        return [
          ...baseActions,
          {
            name: 'My Properties',
            description: 'Manage your listings',
            href: '/seller?tab=properties',
            icon: BuildingOfficeIcon,
            color: 'blue'
          },
          {
            name: 'My Inbox',
            description: 'View buyer inquiries',
            href: '/seller?tab=inbox',
            icon: ChatBubbleLeftRightIcon,
            color: 'yellow'
          },
          {
            name: 'Analytics',
            description: 'Track performance',
            href: '/seller?tab=analytics',
            icon: ChartBarIcon,
            color: 'purple'
          }
        ];
      case 'agent':
        return [
          ...baseActions,
          {
            name: 'My Clients',
            description: 'Manage client relationships',
            href: '/agent',
            icon: UserGroupIcon,
            color: 'green'
          },
          {
            name: 'Create Listing',
            description: 'Add new property',
            href: '/properties/create',
            icon: PlusIcon,
            color: 'blue'
          }
        ];
      case 'renter':
        return [
          ...baseActions,
          {
            name: 'My Applications',
            description: 'Track rental applications',
            href: '/renter',
            icon: ChartBarIcon,
            color: 'purple'
          },
          {
            name: 'Saved Rentals',
            description: 'View saved properties',
            href: '/renter?tab=saved',
            icon: HeartIcon,
            color: 'red'
          }
        ];
      case 'admin':
        return [
          ...baseActions,
          {
            name: 'Admin Panel',
            description: 'Manage platform settings',
            href: '/admin',
            icon: ChartBarIcon,
            color: 'purple'
          },
          {
            name: 'User Management',
            description: 'Manage users and roles',
            href: '/admin?tab=users',
            icon: UserGroupIcon,
            color: 'green'
          }
        ];
      default:
        return baseActions;
    }
  };

  const getStatsCards = (userType) => {
    // These would typically come from API calls
    const mockStats = {
      buyer: [
        { name: 'Properties Viewed', value: '24', icon: EyeIcon, color: 'blue' },
        { name: 'Saved Properties', value: '8', icon: HeartIcon, color: 'red' },
        { name: 'Messages Sent', value: '12', icon: ChatBubbleLeftRightIcon, color: 'green' }
      ],
      seller: [
        { name: 'Active Listings', value: '5', icon: BuildingOfficeIcon, color: 'blue' },
        { name: 'Total Views', value: '1,234', icon: EyeIcon, color: 'green' },
        { name: 'Inquiries', value: '23', icon: ChatBubbleLeftRightIcon, color: 'yellow' }
      ],
      agent: [
        { name: 'Active Listings', value: '12', icon: BuildingOfficeIcon, color: 'blue' },
        { name: 'Total Clients', value: '45', icon: UserGroupIcon, color: 'green' },
        { name: 'Closed Deals', value: '8', icon: CurrencyDollarIcon, color: 'purple' }
      ],
      renter: [
        { name: 'Applications Sent', value: '6', icon: ChartBarIcon, color: 'blue' },
        { name: 'Saved Rentals', value: '12', icon: HeartIcon, color: 'red' },
        { name: 'Messages', value: '8', icon: ChatBubbleLeftRightIcon, color: 'green' }
      ],
      admin: [
        { name: 'Total Users', value: '1,234', icon: UserGroupIcon, color: 'blue' },
        { name: 'Active Listings', value: '456', icon: BuildingOfficeIcon, color: 'green' },
        { name: 'Platform Revenue', value: '$12,345', icon: CurrencyDollarIcon, color: 'purple' }
      ]
    };

    return mockStats[userType] || mockStats.buyer;
  };

  const quickActions = getQuickActions(user?.userType);
  const statsCards = getStatsCards(user?.userType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
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
                  {getWelcomeMessage(user?.userType)}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  {getRoleDisplayName(user?.userType)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
              green: 'from-green-50 to-green-100 border-green-200 text-green-600',
              red: 'from-red-50 to-red-100 border-red-200 text-red-600',
              yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
              purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600'
            };
            
            return (
              <div key={index} className={`bg-gradient-to-br ${colorClasses[stat.color]} rounded-xl p-6 border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-500`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
                green: 'bg-green-50 hover:bg-green-100 border-green-200',
                red: 'bg-red-50 hover:bg-red-100 border-red-200',
                yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
                purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
              };
              
              return (
                <Link
                  key={index}
                  to={action.href}
                  className={`flex items-center p-4 ${colorClasses[action.color]} rounded-lg border transition-all duration-200 hover:shadow-md transform hover:-translate-y-1`}
                >
                  <div className={`bg-${action.color}-500 p-2 rounded-lg mr-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.name}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Property Categories */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Browse Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/properties"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md"
            >
              <HomeIcon className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">All Properties</p>
                <p className="text-sm text-gray-600">View all listings</p>
              </div>
            </Link>
            <Link
              to="/properties?type=apartment"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md"
            >
              <BuildingOfficeIcon className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Apartments</p>
                <p className="text-sm text-gray-600">Modern apartments</p>
              </div>
            </Link>
            <Link
              to="/properties?type=house"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md"
            >
              <HomeModernIcon className="h-6 w-6 text-purple-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Houses</p>
                <p className="text-sm text-gray-600">Family homes</p>
              </div>
            </Link>
            <Link
              to="/properties?type=office"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md"
            >
              <BuildingOffice2Icon className="h-6 w-6 text-orange-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Offices</p>
                <p className="text-sm text-gray-600">Commercial spaces</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Welcome to your dashboard!</p>
                <p className="text-xs text-gray-500">Get started by exploring properties or managing your account.</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Your account is set up and ready to go.</p>
                <p className="text-xs text-gray-500">Start browsing properties or customize your preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
