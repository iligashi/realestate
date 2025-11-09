import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ErrorBoundary from '../../components/ErrorBoundary';
import WishlistManager from '../../components/Buyer/WishlistManager';
import PropertyComparison from '../../components/Buyer/PropertyComparison';
import SavedSearches from '../../components/Buyer/SavedSearches';
import ViewingScheduler from '../../components/Buyer/ViewingScheduler';
import MortgageCalculator from '../../components/Buyer/MortgageCalculator';
import PropertyAlerts from '../../components/Buyer/PropertyAlerts';
import RenterApplicationManagement from '../../components/Renter/RenterApplicationManagement';
import RenterMessages from '../../components/Renter/RenterMessages';
import RenterManagedRentals from '../../components/Renter/RenterManagedRentals';
import favoriteAPI from '../../services/favoriteAPI';
import rentalApplicationAPI from '../../services/rentalApplicationAPI';
import appointmentAPI from '../../services/appointmentAPI';
import notificationAPI from '../../services/notificationAPI';

const RenterDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user = null } = useSelector((state) => state.auth || {});

  const [activeTab, setActiveTab] = useState('wishlist');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({
    favorites: 0,
    applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
    viewings: { upcoming: 0, pending: 0 },
    unreadNotifications: 0,
    recentApplications: []
  });

  useWebSocket();

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [favoritesRes, applicationsRes, viewingsRes, notificationsRes] = await Promise.allSettled([
        favoriteAPI.getFavorites(),
        rentalApplicationAPI.getApplicantApplications({ page: 1, limit: 25 }),
        appointmentAPI.getUserAppointments({ type: 'viewing' }),
        notificationAPI.getNotifications({ read: 'unread' })
      ]);

      const favoritesCount =
        favoritesRes.status === 'fulfilled'
          ? (favoritesRes.value.favorites || []).length
          : 0;

      const applicationsPayload =
        applicationsRes.status === 'fulfilled' ? applicationsRes.value : {};
      const applicationsList = applicationsPayload.applications || [];
      const applicationsTotal = applicationsPayload.pagination?.total ?? applicationsList.length;

      const applicationsStats = applicationsList.reduce(
        (acc, app) => {
          const status = (app.status || 'pending').toLowerCase();
          if (status === 'pending') acc.pending += 1;
          if (status === 'approved') acc.approved += 1;
          if (status === 'rejected') acc.rejected += 1;
          return acc;
        },
        { pending: 0, approved: 0, rejected: 0 }
      );

      const viewingsPayload =
        viewingsRes.status === 'fulfilled' ? viewingsRes.value.appointments || [] : [];
      const viewingsStats = viewingsPayload.reduce(
        (acc, appointment) => {
          const status = (appointment.status || '').toLowerCase();
          if (status === 'pending' || status === 'confirmed') {
            acc.upcoming += 1;
          }
          if (status === 'pending') {
            acc.pending += 1;
          }
          return acc;
        },
        { upcoming: 0, pending: 0 }
      );

      const unreadNotifications =
        notificationsRes.status === 'fulfilled'
          ? notificationsRes.value.unreadCount ??
            (notificationsRes.value.notifications || []).length
          : 0;

      const recentApplications = applicationsList.slice(0, 4).map((app) => ({
        id: app.id ?? app._id,
        title: app.property?.title || 'Unknown property',
        status: (app.status || 'pending').toLowerCase(),
        appliedAt: app.applicationDate || app.createdAt
      }));

      setSummary({
        favorites: favoritesCount,
        applications: {
          total: applicationsTotal,
          ...applicationsStats
        },
        viewings: viewingsStats,
        unreadNotifications,
        recentApplications
      });
    } catch (error) {
      console.error('Failed to load renter dashboard summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const statCards = [
    {
      title: 'Saved Homes',
      value: summary.favorites,
      icon: HeartIcon,
      tone: 'bg-rose-50 text-rose-600',
      helper: summary.favorites ? 'You have properties ready to revisit.' : 'Browse listings to start building your list.'
    },
    {
      title: 'Active Applications',
      value: summary.applications.pending,
      icon: DocumentTextIcon,
      tone: 'bg-blue-50 text-blue-600',
      helper: `${summary.applications.approved} approved • ${summary.applications.rejected} rejected`
    },
    {
      title: 'Upcoming Viewings',
      value: summary.viewings.upcoming,
      icon: CalendarIcon,
      tone: 'bg-emerald-50 text-emerald-600',
      helper: `${summary.viewings.pending} awaiting confirmation`
    },
    {
      title: 'Unread Updates',
      value: summary.unreadNotifications,
      icon: BellIcon,
      tone: 'bg-amber-50 text-amber-600',
      helper: summary.unreadNotifications > 0 ? 'Catch up on your latest notifications.' : 'You’re all caught up!'
    }
  ];

  const tabGroups = useMemo(
    () => [
      {
        label: 'Discover & Plan',
        items: [
          { id: 'wishlist', name: 'Wishlist', icon: HeartIcon, description: 'Manage saved properties' },
          { id: 'compare', name: 'Compare', icon: ScaleIcon, description: 'Compare properties side by side' },
          { id: 'saved-searches', name: 'Saved Searches', icon: MagnifyingGlassIcon, description: 'Manage search alerts' },
          { id: 'viewings', name: 'Viewings', icon: CalendarIcon, description: 'Schedule property viewings' },
          { id: 'alerts', name: 'Property Alerts', icon: BellIcon, description: 'Get listing notifications' },
          { id: 'calculator', name: 'Rent Calculator', icon: CalculatorIcon, description: 'Plan budgets & costs' }
        ]
      },
      {
        label: 'Stay on Track',
        items: [
          { id: 'applications', name: 'Applications', icon: DocumentTextIcon, description: 'Manage rental applications' },
          { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon, description: 'Chat with landlords' },
          { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'All alerts & activity' },
          { id: 'my-rentals', name: 'My Rentals', icon: BuildingOfficeIcon, description: 'Manage listings I created' }
        ]
      }
    ],
    []
  );

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
        return <RenterApplicationManagement />;
      case 'messages':
        return <RenterMessages />;
      case 'notifications':
        return (
          <div className="p-6 text-center text-sm text-gray-500">
            Notifications now live under the main bell icon so you can check them from anywhere.
          </div>
        );
      case 'my-rentals':
        return <RenterManagedRentals />;
      default:
        return (
          <div className="p-6 text-center text-sm text-gray-500">
            Choose a tool from the left to get started.
          </div>
        );
    }
  };

  const recentTimeline = summary.recentApplications;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Welcome back, {user?.firstName || 'there'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Track saved homes, applications, viewings, and listings—all from one dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/properties')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:text-gray-900"
            >
              <HomeIcon className="h-5 w-5" />
              Browse listings
            </button>
            <button
              onClick={() => navigate('/properties/create-rental')}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <PlusIcon className="h-5 w-5" />
              List a rental
            </button>
            <button
              onClick={() => fetchSummary()}
              className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Refresh overview
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{summaryLoading ? '—' : card.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.tone}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">{card.helper}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
          <aside className="space-y-6">
            {tabGroups.map((group) => (
              <section key={group.label} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</h3>
                </div>
                <nav className="p-2">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <div>{tab.name}</div>
                          <p className="text-xs font-normal text-gray-500">{tab.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </section>
            ))}
          </aside>

          <div className="space-y-8">
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <ErrorBoundary>{renderTabContent()}</ErrorBoundary>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Latest application progress</h2>
                <div className="text-xs text-gray-500">
                  {summaryLoading ? 'Updating…' : new Date().toLocaleTimeString()}
                </div>
              </div>
              {summaryLoading ? (
                <div className="mt-6 space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="animate-pulse rounded-lg bg-gray-100 p-4">
                      <div className="h-3 w-1/3 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : recentTimeline.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  Submit applications to see your status timeline here.
                </p>
              ) : (
                <ol className="mt-6 space-y-4">
                  {recentTimeline.map((item) => (
                    <li key={item.id} className="flex gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <span className="mt-1.5 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.status}</p>
                        <p className="mt-1 text-xs text-gray-400">Applied {formatRelativeTime(item.appliedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'recently';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 60) return `${diffMinutes || 1} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
};

export default RenterDashboard;

