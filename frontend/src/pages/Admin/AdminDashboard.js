import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  fetchDashboardAnalytics,
  fetchAllUsers,
  fetchAllListings,
  fetchAllReports,
  updateUser,
  deleteUser,
  updateListingStatus,
  deleteListing,
  resolveReport,
  clearError,
  clearSuccessMessage,
  updateUserFilters,
  updateListingFilters,
  updateReportFilters,
  resetUserFilters,
  resetListingFilters,
  resetReportFilters,
  fetchPlatformSettings,
  updatePlatformSettings,
  fetchFeaturedListings,
  updateFeaturedListing,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  fetchEnhancedAnalytics,
  fetchRevenueAnalytics
} from '../../store/slices/adminSlice';
import { 
  UsersIcon, 
  HomeIcon, 
  FlagIcon, 
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  StarIcon,
  MegaphoneIcon,
  CurrencyDollarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import ReportForm from '../../components/ReportForm';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { 
    analytics, 
    users, 
    listings, 
    reports, 
    loading, 
    error, 
    successMessage,
    enhancedAnalytics,
    revenueAnalytics
  } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUser, setReportingUser] = useState(null);

  // Load initial data
  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchDashboardAnalytics());
      dispatch(fetchAllUsers());
      dispatch(fetchAllListings());
      dispatch(fetchAllReports());
      dispatch(fetchPlatformSettings());
      dispatch(fetchFeaturedListings());
      dispatch(fetchAnnouncements());
      dispatch(fetchEnhancedAnalytics());
      dispatch(fetchRevenueAnalytics());
    }
  }, [dispatch, user]);

  // Handle success/error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [successMessage, error, dispatch]);

  // Handle filter changes
  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchAllUsers(users.filters));
    }
  }, [dispatch, user, users.filters]);

  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchAllListings(listings.filters));
    }
  }, [dispatch, user, listings.filters]);

  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchAllReports(reports.filters));
    }
  }, [dispatch, user, reports.filters]);

  // Action handlers
  const handleUserUpdate = async (userId, userData) => {
    try {
      await dispatch(updateUser({ userId, userData })).unwrap();
      setEditingUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleListingStatusUpdate = async (listingId, statusData) => {
    try {
      await dispatch(updateListingStatus({ listingId, statusData })).unwrap();
      setEditingListing(null);
      toast.success('Listing status updated successfully');
    } catch (error) {
      toast.error('Failed to update listing status');
    }
  };

  const handleListingDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await dispatch(deleteListing(listingId)).unwrap();
        toast.success('Listing deleted successfully');
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleReportResolution = async (reportId, resolutionData) => {
    try {
      await dispatch(resolveReport({ reportId, resolutionData })).unwrap();
      setEditingReport(null);
      toast.success('Report resolved successfully');
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  const handleReportUser = (userItem) => {
    setReportingUser(userItem);
    setShowReportModal(true);
  };

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon, color: 'blue' },
    { id: 'users', name: 'Users', icon: UsersIcon, color: 'green' },
    { id: 'listings', name: 'Listings', icon: HomeIcon, color: 'purple' },
    { id: 'reports', name: 'Reports', icon: FlagIcon, color: 'red' },
    { id: 'analytics', name: 'Analytics', icon: ChartPieIcon, color: 'indigo' },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, color: 'gray' }
  ];

  // Stats Card Component
  const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500',
      yellow: 'bg-yellow-500'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 truncate">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-xs sm:text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                )}
                <span className="truncate">{trendValue}</span>
          </div>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${colorClasses[color] || 'bg-gray-500'}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        </div>
      </div>
    );
  };

  const defaultCurrency = revenueAnalytics?.primaryCurrency || 'USD';

  const formatNumber = (value) => {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) {
      return '0';
    }
    return number.toLocaleString();
  };

  const formatCurrency = (value, currency = defaultCurrency) => {
    const number = Number(value ?? 0);
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    });
    if (!Number.isFinite(number)) {
      return formatter.format(0);
    }
    return formatter.format(number);
  };

  const toTitleCase = (text = '') => {
    if (!text) return '';
    return text
      .replace(/_/g, ' ')
      .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  };

  const computeSeriesTrend = (series = [], key = 'count') => {
    if (!Array.isArray(series) || series.length < 2) {
      return { direction: null, label: null };
    }
    const latest = series[series.length - 1] || {};
    const previous = series[series.length - 2] || {};
    const latestValue = Number(latest?.[key] ?? latest?.count ?? 0);
    const previousValue = Number(previous?.[key] ?? previous?.count ?? 0);

    if (!Number.isFinite(latestValue) || !Number.isFinite(previousValue)) {
      return { direction: null, label: null };
    }

    if (previousValue === 0) {
      if (latestValue === 0) {
        return { direction: null, label: null };
      }
      return { direction: 'up', label: '+100%' };
    }

    const change = ((latestValue - previousValue) / previousValue) * 100;
    if (!Number.isFinite(change)) {
      return { direction: null, label: null };
    }

    const roundedChange = change.toFixed(1);
    return {
      direction: change >= 0 ? 'up' : 'down',
      label: `${change >= 0 ? '+' : ''}${roundedChange}%`
    };
  };

  const getRelativeTime = (input) => {
    if (!input) return '—';
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '—';

    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return 'just now';

    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  };

  const activityFeed = useMemo(() => {
    const userEvents = (analytics.recentUsers || []).map((userItem, index) => ({
      id: `user-${userItem?.id ?? userItem?.email ?? index}`,
      type: 'user',
      title: `${userItem.firstName || ''} ${userItem.lastName || ''}`.trim() || 'New user',
      description: `Joined as ${toTitleCase(userItem.userType)}`,
      timestamp: userItem.createdAt
    }));

    const listingEvents = (analytics.recentListings || []).map((listing, index) => ({
      id: `listing-${listing?.id ?? listing?.title ?? index}`,
      type: 'listing',
      title: listing.title || 'Listing update',
      description: `${toTitleCase(listing.status || 'pending')} listing`,
      timestamp: listing.createdAt
    }));

    const reportEvents = (analytics.recentReports || []).map((report, index) => ({
      id: `report-${report?.id ?? index}`,
      type: 'report',
      title: `Report #${report.id}`,
      description: `${toTitleCase(report.type)} · ${toTitleCase(report.status)}`,
      timestamp: report.createdAt
    }));

    return [...userEvents, ...listingEvents, ...reportEvents]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
  }, [analytics.recentUsers, analytics.recentListings, analytics.recentReports]);

  const alerts = useMemo(() => {
    const pendingListings = analytics.listings?.pending || 0;
    const pendingReports = analytics.reports?.pending || 0;
    const blockedUsers = analytics.users?.blocked || 0;

    const alertItems = [];

    if (pendingListings > 0) {
      alertItems.push({
        id: 'pending-listings',
        type: 'warning',
        title: 'Listings awaiting review',
        message: `${pendingListings} listing${pendingListings !== 1 ? 's' : ''} pending approval.`
      });
    }

    if (pendingReports > 0) {
      alertItems.push({
        id: 'pending-reports',
        type: 'alert',
        title: 'Reports awaiting action',
        message: `${pendingReports} report${pendingReports !== 1 ? 's' : ''} pending resolution.`
      });
    }

    if (blockedUsers > 0) {
      alertItems.push({
        id: 'blocked-users',
        type: 'info',
        title: 'Blocked accounts',
        message: `${blockedUsers} user${blockedUsers !== 1 ? 's' : ''} currently blocked.`
      });
    }

    if (alertItems.length === 0) {
      alertItems.push({
        id: 'all-clear',
        type: 'success',
        title: 'All systems operational',
        message: 'No outstanding alerts detected.'
      });
    }

    return alertItems;
  }, [analytics.listings, analytics.reports, analytics.users]);

  // Dashboard Overview Component
  const DashboardOverview = () => {
    const lastUpdated = analytics.lastUpdated ? new Date(analytics.lastUpdated) : null;
    const lastUpdatedLabel = lastUpdated ? lastUpdated.toLocaleString() : '—';

    const periodLabels = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '1y': 'Last 12 months'
    };
    const revenuePeriodLabel = periodLabels[revenueAnalytics.period] || 'Current period';

    const userTrend = computeSeriesTrend(enhancedAnalytics?.userGrowth);
    const listingTrend = computeSeriesTrend(enhancedAnalytics?.listingPerformance);
    const revenueTrend = (() => {
      if (revenueAnalytics.revenueChange === null || revenueAnalytics.revenueChange === undefined) {
        return { direction: null, label: null };
      }
      const changeValue = Number(revenueAnalytics.revenueChange);
      if (!Number.isFinite(changeValue)) {
        return { direction: null, label: null };
      }
      return {
        direction: changeValue >= 0 ? 'up' : 'down',
        label: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(1)}%`
      };
    })();

    const reportResolutionRate = analytics.reports?.total
      ? (analytics.reports.resolved / analytics.reports.total) * 100
      : null;
    const reportTrend = reportResolutionRate !== null
      ? {
          direction: reportResolutionRate >= 50 ? 'up' : 'down',
          label: `${reportResolutionRate.toFixed(1)}% resolved`
        }
      : { direction: null, label: null };

    const quickStats = [
      {
        id: 'payments',
        label: 'Completed Payments',
        value: formatNumber(revenueAnalytics.transactionsCount),
        hint: revenuePeriodLabel
      },
      {
        id: 'average-transaction',
        label: 'Avg Transaction',
        value: formatCurrency(revenueAnalytics.averageTransactionValue),
        hint: `Across ${formatNumber(revenueAnalytics.transactionsCount)} payments`
      },
      {
        id: 'commission',
        label: 'Commission Earned',
        value: formatCurrency(revenueAnalytics.commissionEarnings),
        hint: 'Platform fees collected'
      },
      {
        id: 'featured',
        label: 'Featured Listing Revenue',
        value: formatCurrency(revenueAnalytics.featuredListingRevenue),
        hint: 'Premium placements'
      }
    ];

    const listingBreakdown = [
      {
        label: 'Pending',
        value: formatNumber(analytics.listings?.pending),
        badgeClass: 'bg-yellow-100 text-yellow-800'
      },
      {
        label: 'Approved',
        value: formatNumber(analytics.listings?.approved),
        badgeClass: 'bg-green-100 text-green-800'
      },
      {
        label: 'Rejected',
        value: formatNumber(analytics.listings?.rejected),
        badgeClass: 'bg-red-100 text-red-800'
      }
    ];

    const roleDistribution = (analytics.roleDistribution || []).map((role) => ({
      label: role.userType,
      value: formatNumber(role.count)
    }));

    const topPaymentMethod = revenueAnalytics.topPaymentMethod
      ? toTitleCase(revenueAnalytics.topPaymentMethod)
      : 'No payments yet';
    const primaryCurrency = revenueAnalytics.primaryCurrency || defaultCurrency;

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {user?.firstName || 'Admin'}!</h1>
              <p className="text-blue-100 text-sm sm:text-base">Here's what's happening with your platform today.</p>
            </div>
            <div className="flex items-center justify-between sm:block">
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-blue-100">Last updated</p>
                <p className="text-sm sm:text-lg font-semibold">{lastUpdatedLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            title="Total Users"
            value={formatNumber(analytics.users?.total)}
            subtitle={`${formatNumber(analytics.users?.active)} active`}
            icon={UsersIcon}
            color="blue"
            trend={userTrend.direction}
            trendValue={userTrend.label}
          />
          <StatsCard
            title="Total Listings"
            value={formatNumber(analytics.listings?.total)}
            subtitle={`${formatNumber(analytics.listings?.pending)} pending`}
            icon={HomeIcon}
            color="green"
            trend={listingTrend.direction}
            trendValue={listingTrend.label}
          />
          <StatsCard
            title="Reports"
            value={formatNumber(analytics.reports?.total)}
            subtitle={`${formatNumber(analytics.reports?.pending)} pending`}
            icon={FlagIcon}
            color="red"
            trend={reportTrend.direction}
            trendValue={reportTrend.label}
          />
          <StatsCard
            title="Platform Revenue"
            value={formatCurrency(revenueAnalytics.totalRevenue)}
            subtitle={revenuePeriodLabel}
            icon={CurrencyDollarIcon}
            color="purple"
            trend={revenueTrend.direction}
            trendValue={revenueTrend.label}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {activityFeed.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity recorded.</p>
              ) : (
                activityFeed.map((item) => {
                  const typeStyles = {
                    user: { dot: 'bg-green-500', icon: UsersIcon },
                    listing: { dot: 'bg-blue-500', icon: HomeIcon },
                    report: { dot: 'bg-red-500', icon: FlagIcon }
                  };
                  const IconComponent = typeStyles[item.type]?.icon || InformationCircleIcon;
                  const dotClass = typeStyles[item.type]?.dot || 'bg-gray-400';
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 ${dotClass} rounded-full flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate flex items-center space-x-2">
                          <IconComponent className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{getRelativeTime(item.timestamp)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {quickStats.map((stat) => (
                <div key={stat.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                  {stat.hint && <p className="text-[11px] text-gray-400 mt-1">{stat.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Listing Performance</h3>
              <CheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {listingBreakdown.map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.badgeClass}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active users</span>
                <span className="text-sm font-semibold text-gray-900">{formatNumber(analytics.users?.active)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Blocked users</span>
                <span className="text-sm font-semibold text-gray-900">{formatNumber(analytics.users?.blocked)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                {roleDistribution.length === 0 ? (
                  <p className="text-sm text-gray-500">No role data available.</p>
                ) : (
                  roleDistribution.map((role) => (
                    <div key={role.label} className="flex justify-between items-center text-sm text-gray-600">
                      <span className="capitalize">{role.label}</span>
                      <span className="font-medium text-gray-900">{role.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Top payment method</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{topPaymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Primary currency</span>
                <span className="text-sm font-semibold text-gray-900">{primaryCurrency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="text-sm font-semibold text-gray-900">{formatNumber(revenueAnalytics.transactionsCount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const alertConfig = {
                warning: {
                  icon: ExclamationTriangleIcon,
                  wrapper: 'bg-yellow-50',
                  titleColor: 'text-yellow-800',
                  messageColor: 'text-yellow-600',
                  iconColor: 'text-yellow-500'
                },
                alert: {
                  icon: FlagIcon,
                  wrapper: 'bg-red-50',
                  titleColor: 'text-red-800',
                  messageColor: 'text-red-600',
                  iconColor: 'text-red-500'
                },
                info: {
                  icon: InformationCircleIcon,
                  wrapper: 'bg-blue-50',
                  titleColor: 'text-blue-800',
                  messageColor: 'text-blue-600',
                  iconColor: 'text-blue-500'
                },
                success: {
                  icon: CheckIcon,
                  wrapper: 'bg-green-50',
                  titleColor: 'text-green-800',
                  messageColor: 'text-green-600',
                  iconColor: 'text-green-500'
                }
              }[alert.type] || {
                icon: InformationCircleIcon,
                wrapper: 'bg-gray-50',
                titleColor: 'text-gray-800',
                messageColor: 'text-gray-600',
                iconColor: 'text-gray-500'
              };
              const AlertIcon = alertConfig.icon;
              return (
                <div key={alert.id} className={`flex items-start space-x-3 p-3 rounded-lg ${alertConfig.wrapper}`}>
                  <AlertIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${alertConfig.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${alertConfig.titleColor}`}>{alert.title}</p>
                    <p className={`text-xs mt-1 ${alertConfig.messageColor}`}>{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // User Management Component
  const UserManagement = () => {
    if (!users || !users.list) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading users...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600 mt-1">{users.total || 0} users found</p>
              </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={users.filters.search || ''}
              onChange={(e) => dispatch(updateUserFilters({ search: e.target.value }))}
            />
              </div>
            <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={users.filters.role || ''}
              onChange={(e) => dispatch(updateUserFilters({ role: e.target.value }))}
            >
              <option value="">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="renter">Renter</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={users.filters.status || ''}
              onChange={(e) => dispatch(updateUserFilters({ status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
            <button
              onClick={() => dispatch(resetUserFilters())}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.list.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {userItem.profilePicture ? (
                        <img className="h-10 w-10 rounded-full" src={userItem.profilePicture} alt="" />
                      ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                            {userItem.firstName?.[0]}{userItem.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {userItem.firstName} {userItem.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{userItem.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {userItem.userType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userItem.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {userItem.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(userItem.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingUser(userItem)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                        <button
                          onClick={() => handleReportUser(userItem)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        >
                          <FlagIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUserDelete(userItem.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Delete user"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
      </div>

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                userType: formData.get('userType'),
                isBlocked: formData.get('isBlocked') === 'true'
              };
              handleUserUpdate(editingUser.id, userData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={editingUser.firstName}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={editingUser.lastName}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="userType"
                    defaultValue={editingUser.userType}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="renter">Renter</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="isBlocked"
                    defaultValue={editingUser.isBlocked ? 'true' : 'false'}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="false">Active</option>
                    <option value="true">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  };

  // Listing Management Component
  const ListingManagement = () => {
    if (!listings || !listings.list) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading listings...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Listing Management</h2>
              <p className="text-gray-600 mt-1">{listings.total || 0} listings found</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={listings.filters.search || ''}
              onChange={(e) => dispatch(updateListingFilters({ search: e.target.value }))}
            />
              </div>
            <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={listings.filters.status || ''}
              onChange={(e) => dispatch(updateListingFilters({ status: e.target.value }))}
            >
              <option value="">All Status</option>
                <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={listings.filters.propertyType || ''}
                onChange={(e) => dispatch(updateListingFilters({ propertyType: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
            </select>
            <button
              onClick={() => dispatch(resetListingFilters())}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.list.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {listing.images?.[0] ? (
                        <img className="h-10 w-10 rounded object-cover" src={listing.images[0]} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-300 flex items-center justify-center">
                          <HomeIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                      <div className="text-sm text-gray-500">
                        {listing.address?.street && `${listing.address.street}, `}
                        {listing.address?.city && `${listing.address.city}, `}
                        {listing.address?.state && `${listing.address.state} `}
                        {listing.address?.zipCode && `${listing.address.zipCode}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      Owner: {listing.owner ? `${listing.owner.firstName || ''} ${listing.owner.lastName || ''}`.trim() : 'N/A'}
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                        listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        listing.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingListing(listing)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Edit listing"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleListingDelete(listing.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Delete listing"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Reports Management Component
  const ReportsManagement = () => {
    if (!reports || !reports.list) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading reports...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reports Management</h2>
              <p className="text-gray-600 mt-1">{reports.total || 0} reports found</p>
            </div>
            <div className="flex flex-wrap gap-3">
            <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={reports.filters.status || ''}
              onChange={(e) => dispatch(updateReportFilters({ status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={reports.filters.type || ''}
              onChange={(e) => dispatch(updateReportFilters({ type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="fraud">Fraud</option>
                <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={() => dispatch(resetReportFilters())}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
            {reports.list.map((report) => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {report.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Report #{report.id}
                    </h3>
                    <p className="text-gray-600 mb-4">{report.reason}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingReport(report)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleReportResolution(report.id, { status: 'resolved' })}
                      className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      );
  };

  // Analytics Component
  const Analytics = () => (
      <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">User Growth</h3>
            <p className="text-3xl font-bold mb-2">+24%</p>
            <p className="text-blue-100">Compared to last month</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Revenue</h3>
            <p className="text-3xl font-bold mb-2">$45,678</p>
            <p className="text-green-100">This quarter</p>
          </div>
        </div>
      </div>
      </div>
  );

  // Settings Component
  const Settings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Send email notifications to users</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
              <p className="text-sm text-gray-500">Enable maintenance mode for the platform</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'listings':
        return <ListingManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  if (!user || user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Admin Panel</h1>
                    <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
        <nav className="mt-4 sm:mt-6 px-3 overflow-y-auto h-full pb-20">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                  <button
                  key={item.id}
                    onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                  </button>
              );
            })}
            </div>
        </nav>
          </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6 xl:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative">
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 rounded-full"></span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Report Modal */}
      {reportingUser && (
        <ReportForm
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportingUser(null);
          }}
          reportedItem={reportingUser}
          reportedItemType="User"
        />
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Listing Status</h3>
              <button
                onClick={() => setEditingListing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {editingListing.title}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {editingListing.status}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={editingListing.status}
                  onChange={(e) => setEditingListing({
                    ...editingListing,
                    status: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingListing(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleListingStatusUpdate(editingListing.id, { status: editingListing.status })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {editingUser.firstName} {editingUser.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {editingUser.email}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Role
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {editingUser.userType}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={editingUser.userType}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    userType: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="renter">Renter</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingUser.isBlocked ? 'blocked' : 'active'}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    isBlocked: e.target.value === 'blocked'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserUpdate(editingUser.id, { 
                  userType: editingUser.userType,
                  isBlocked: editingUser.isBlocked
                })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  // NEW: Platform Settings Component
  const PlatformSettings = () => {
    const dispatch = useDispatch();
    const { platformSettings } = useSelector(state => state.admin);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(platformSettings || {
      general: {},
      appearance: {},
      business: {},
      features: {},
      security: {},
      notifications: {},
      maintenance: {}
    });

    // Update formData when platformSettings changes
    useEffect(() => {
      if (platformSettings) {
        setFormData(platformSettings);
      }
    }, [platformSettings]);

    // Show loading state if platformSettings is not loaded yet
    if (!platformSettings) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading platform settings...</p>
          </div>
        </div>
      );
    }

    const handleSave = async () => {
      try {
        await dispatch(updatePlatformSettings(formData)).unwrap();
        setIsEditing(false);
        toast.success('Platform settings updated successfully');
      } catch (error) {
        toast.error(error || 'Failed to update platform settings');
      }
    };

    const handleCancel = () => {
      setFormData(platformSettings);
      setIsEditing(false);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
            <p className="text-gray-600">Manage site-wide configuration and appearance</p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Edit Settings
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Site Name</label>
                <input
                  type="text"
                  value={formData?.general?.siteName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    general: { ...formData.general || {}, siteName: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Site Description</label>
                <textarea
                  value={formData?.general?.siteDescription || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    general: { ...formData.general || {}, siteDescription: e.target.value }
                  })}
                  disabled={!isEditing}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={formData?.general?.contactEmail || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    general: { ...formData.general || {}, contactEmail: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Business Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Business Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData?.business?.commissionRate || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    business: { ...formData.business || {}, commissionRate: parseFloat(e.target.value) }
                  })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Featured Listing Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData?.business?.featuredListingPrice || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    business: { ...formData.business || {}, featuredListingPrice: parseFloat(e.target.value) }
                  })}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // NEW: Featured Listings Component
  const FeaturedListings = () => {
    const { featuredListings } = useSelector(state => state.admin);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Listings</h2>
            <p className="text-gray-600">Manage premium and highlighted property listings</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Featured: {featuredListings?.total || 0}
          </div>
        </div>

        {/* Featured Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!featuredListings?.list || featuredListings.list.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No featured listings</h3>
              <p className="mt-1 text-sm text-gray-500">Start featuring listings to highlight premium properties.</p>
            </div>
          ) : (
            (featuredListings?.list || []).map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{listing.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {listing.description ? listing.description.substring(0, 100) + '...' : 'No description available'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      ${listing.price ? listing.price.toLocaleString() : 'N/A'}
                    </span>
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // NEW: System Announcements Component
  const SystemAnnouncements = () => {
    const dispatch = useDispatch();
    const { announcements } = useSelector(state => state.admin);
    const [isCreating, setIsCreating] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const handleCreate = async (announcementData) => {
      try {
        await dispatch(createAnnouncement(announcementData)).unwrap();
        setIsCreating(false);
        toast.success('Announcement created successfully');
      } catch (error) {
        toast.error(error || 'Failed to create announcement');
      }
    };

    const handleUpdate = async (announcementId, announcementData) => {
      try {
        await dispatch(updateAnnouncement({ announcementId, announcementData })).unwrap();
        setEditingAnnouncement(null);
        toast.success('Announcement updated successfully');
      } catch (error) {
        toast.error(error || 'Failed to update announcement');
      }
    };

    const handleDelete = async (announcementId) => {
      if (window.confirm('Are you sure you want to delete this announcement?')) {
        try {
          await dispatch(deleteAnnouncement(announcementId)).unwrap();
          toast.success('Announcement deleted successfully');
        } catch (error) {
          toast.error(error || 'Failed to delete announcement');
        }
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Announcements</h2>
            <p className="text-gray-600">Manage platform-wide notifications and announcements</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            New Announcement
          </button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.list.length === 0 ? (
            <div className="text-center py-12">
              <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first announcement to notify users.</p>
            </div>
          ) : (
            announcements.list.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                    <p className="text-gray-600 mt-2">{announcement.content}</p>
                    <div className="flex items-center mt-4 text-sm text-gray-500">
                      <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      {announcement.isActive && (
                        <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingAnnouncement(announcement)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {(isCreating || editingAnnouncement) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isCreating ? 'Create Announcement' : 'Edit Announcement'}
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const announcementData = {
                  title: formData.get('title'),
                  content: formData.get('content'),
                  isActive: formData.get('isActive') === 'true'
                };
                
                if (isCreating) {
                  handleCreate(announcementData);
                } else {
                  handleUpdate(editingAnnouncement.id, announcementData);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingAnnouncement?.title || ''}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      name="content"
                      rows={4}
                      defaultValue={editingAnnouncement?.content || ''}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="isActive"
                      defaultValue={editingAnnouncement?.isActive?.toString() || 'true'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {isCreating ? 'Create' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingAnnouncement(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // NEW: Enhanced Analytics Component
  const EnhancedAnalytics = () => {
    const { enhancedAnalytics, revenueAnalytics, loading } = useSelector(state => state.admin);

    // Show loading state while data is being fetched
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h2>
              <p className="text-gray-600">Comprehensive insights and performance metrics</p>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      );
    }

    // Show message if no data is available
    if (!enhancedAnalytics && !revenueAnalytics) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h2>
              <p className="text-gray-600">Comprehensive insights and performance metrics</p>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">No analytics data available. Please try refreshing the page.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h2>
            <p className="text-gray-600">Comprehensive insights and performance metrics</p>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(revenueAnalytics?.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Commission Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${(revenueAnalytics?.commissionEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Featured Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(revenueAnalytics?.featuredListingRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">+12.5%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue Trend</h3>
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - Monthly revenue data</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - User growth data</p>
            </div>
          </div>
        </div>

        {/* Geographic Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Locations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!enhancedAnalytics || !enhancedAnalytics.geographicData || enhancedAnalytics.geographicData.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No geographic data available</p>
              </div>
            ) : (
              enhancedAnalytics.geographicData.map((location, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900">{location.city}</h4>
                  <p className="text-2xl font-bold text-indigo-600">{location.count}</p>
                  <p className="text-sm text-gray-500">listings</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

export default AdminDashboard;