import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  HomeModernIcon, 
  BuildingOffice2Icon,
  ChartBarIcon,
  UserGroupIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  CalendarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import favoriteAPI from '../../services/favoriteAPI';
import buyerPreferenceAPI from '../../services/buyerPreferenceAPI';
import notificationAPI from '../../services/notificationAPI';
import appointmentAPI from '../../services/appointmentAPI';
import rentalApplicationAPI from '../../services/rentalApplicationAPI';
import sellerAPI from '../../services/sellerAPI';
import { adminAPI } from '../../services/adminAPI';
import messageAPI from '../../services/messageAPI';

const STAT_COLOR_CLASSES = {
  blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
  green: 'from-green-50 to-green-100 border-green-200 text-green-600',
  red: 'from-red-50 to-red-100 border-red-200 text-red-600',
  yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
  purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
  orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
  gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-600'
};

const STAT_ICON_BG_CLASSES = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500'
};

const TONE_COLORS = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-400'
};

const formatNumber = (value, options = {}) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    ...options
  }).format(numeric);
};

const formatDuration = (minutes) => {
  const numeric = Number(minutes);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  if (numeric < 1) {
    return '<1 min';
  }
  if (numeric < 60) {
    return `${Math.round(numeric)} min`;
  }
  const hours = Math.floor(numeric / 60);
  const mins = Math.round(numeric % 60);
  if (mins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value) => {
  const parsed = parseDate(value);
  if (!parsed) return '';
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const createStatCard = (name, value, icon, color = 'blue', helper = '') => ({
  name,
  value,
  icon,
  color,
  helper
});

const createActivityItem = (title, description, timestamp = null, tone = 'blue') => ({
  title,
  description,
  timestamp,
  tone
});

const ensureRecentActivity = (items) => {
  if (!items || items.length === 0) {
    return [
      createActivityItem(
        'You’re all caught up',
        'Interact with the platform to see your recent activity here.',
        null,
        'gray'
      )
    ];
  }
  return items.slice(0, 6);
};

const buildBuyerDashboardSummary = async () => {
  const now = new Date();
  const [favoritesRes, savedSearchesRes, alertsRes, notificationsRes, appointmentsRes] =
    await Promise.allSettled([
      favoriteAPI.getFavorites(),
      buyerPreferenceAPI.getSavedSearches(),
      buyerPreferenceAPI.getPropertyAlerts(),
      notificationAPI.getNotifications({}),
      appointmentAPI.getUserAppointments({ type: 'viewing' })
    ]);

  const favorites =
    favoritesRes.status === 'fulfilled' ? favoritesRes.value?.favorites || [] : [];
  const savedSearches =
    savedSearchesRes.status === 'fulfilled' ? savedSearchesRes.value?.savedSearches || [] : [];
  const propertyAlerts =
    alertsRes.status === 'fulfilled' ? alertsRes.value?.propertyAlerts || [] : [];

  const notificationsPayload =
    notificationsRes.status === 'fulfilled' ? notificationsRes.value || {} : {};
  const notifications = notificationsPayload.notifications || [];
  const unreadNotifications =
    notificationsPayload.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const appointments =
    appointmentsRes.status === 'fulfilled'
      ? appointmentsRes.value?.appointments || []
      : [];

  const upcomingAppointments = appointments
    .map((appt) => ({
      appointment: appt,
      start: parseDate(appt.start_time || appt.startTime || appt.startDate)
    }))
    .filter(
      ({ start, appointment }) =>
        start &&
        start >= now &&
        ['pending', 'confirmed'].includes((appointment.status || '').toLowerCase())
    )
    .sort((a, b) => a.start - b.start);

  const nextAppointment = upcomingAppointments[0]?.appointment;

  const statsCards = [
    createStatCard(
      'Saved Homes',
      formatNumber(favorites.length),
      HeartIcon,
      'red',
      favorites.length
        ? `Most recent: ${favorites[0].property?.title || 'Property'}`
        : 'Save properties to track opportunities.'
    ),
    createStatCard(
      'Saved Searches',
      formatNumber(savedSearches.length),
      MagnifyingGlassIcon,
      'purple',
      propertyAlerts.length
        ? `${formatNumber(propertyAlerts.length)} active alerts`
        : 'Create alerts to get notified instantly.'
    ),
    createStatCard(
      'Upcoming Viewings',
      formatNumber(upcomingAppointments.length),
      CalendarIcon,
      'green',
      nextAppointment
        ? `Next: ${formatDateTime(nextAppointment.start_time || nextAppointment.startTime)}`
        : 'Schedule a viewing to see it here.'
    ),
    createStatCard(
      'Unread Notifications',
      formatNumber(unreadNotifications),
      BellIcon,
      'yellow',
      unreadNotifications ? 'Check your inbox for updates.' : 'You’re all caught up!'
    )
  ];

  const recentActivity = [];

  if (favorites.length) {
    recentActivity.push(
      createActivityItem(
        'Saved property',
        favorites[0].property?.title || 'Property saved',
        favorites[0].savedAt || favorites[0].createdAt,
        'red'
      )
    );
  }

  if (savedSearches.length) {
    const latestSearch = savedSearches[0];
    recentActivity.push(
      createActivityItem(
        'Saved search updated',
        latestSearch.name || 'Search updated',
        latestSearch.updatedAt || latestSearch.createdAt,
        'purple'
      )
    );
  }

  if (nextAppointment) {
    recentActivity.push(
      createActivityItem(
        'Viewing scheduled',
        nextAppointment.property?.title || 'Viewing arranged',
        nextAppointment.start_time || nextAppointment.startTime,
        'green'
      )
    );
  } else if (appointments.length) {
    const latestAppointment = appointments
      .map((appt) => ({
        appt,
        timestamp:
          parseDate(appt.updatedAt) ||
          parseDate(appt.start_time) ||
          parseDate(appt.startTime) ||
          parseDate(appt.createdAt)
      }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

    if (latestAppointment) {
      recentActivity.push(
        createActivityItem(
          'Viewing activity',
          latestAppointment.appt.property?.title || 'Viewing update recorded',
          latestAppointment.timestamp,
          'green'
        )
      );
    }
  }

  if (notifications.length) {
    const latestNotification = notifications[0];
    recentActivity.push(
      createActivityItem(
        latestNotification.title || 'New notification',
        latestNotification.content || 'A new notification was received',
        latestNotification.createdAt,
        'yellow'
      )
    );
  }

  return {
    statsCards,
    recentActivity: ensureRecentActivity(recentActivity)
  };
};

const buildRenterDashboardSummary = async () => {
  const now = new Date();
  const [favoritesRes, applicationsRes, viewingsRes, notificationsRes] = await Promise.allSettled([
    favoriteAPI.getFavorites(),
    rentalApplicationAPI.getApplicantApplications({ page: 1, limit: 25 }),
    appointmentAPI.getUserAppointments({ type: 'viewing' }),
    notificationAPI.getNotifications({ read: 'unread' })
  ]);

  const favorites =
    favoritesRes.status === 'fulfilled' ? favoritesRes.value?.favorites || [] : [];

  const applicationsPayload =
    applicationsRes.status === 'fulfilled' ? applicationsRes.value || {} : {};
  const applicationsList = applicationsPayload.applications || [];
  const applicationsTotal =
    applicationsPayload.pagination?.total ?? applicationsList.length;

  const applicationStats = applicationsList.reduce(
    (acc, app) => {
      const status = (app.status || 'pending').toLowerCase();
      if (status === 'pending') acc.pending += 1;
      if (status === 'approved') acc.approved += 1;
      if (status === 'rejected') acc.rejected += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const viewings =
    viewingsRes.status === 'fulfilled' ? viewingsRes.value?.appointments || [] : [];

  const viewingsStats = viewings.reduce(
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

  const upcomingViewings = viewings
    .map((appointment) => ({
      appointment,
      start: parseDate(appointment.start_time || appointment.startTime || appointment.startDate)
    }))
    .filter(
      ({ start, appointment }) =>
        start &&
        start >= now &&
        ['pending', 'confirmed'].includes((appointment.status || '').toLowerCase())
    )
    .sort((a, b) => a.start - b.start);

  const nextViewing = upcomingViewings[0]?.appointment;

  const notificationsPayload =
    notificationsRes.status === 'fulfilled' ? notificationsRes.value || {} : {};
  const unreadNotifications =
    notificationsPayload.unreadCount ??
    (notificationsPayload.notifications || []).filter((n) => !n.isRead).length;

  const statsCards = [
    createStatCard(
      'Saved Homes',
      formatNumber(favorites.length),
      HeartIcon,
      'red',
      favorites.length
        ? `Most recent: ${favorites[0].property?.title || 'Property'}`
        : 'Save rentals you love to track them here.'
    ),
    createStatCard(
      'Applications',
      formatNumber(applicationsTotal),
      DocumentTextIcon,
      'blue',
      `${formatNumber(applicationStats.pending)} pending • ${formatNumber(
        applicationStats.approved
      )} approved`
    ),
    createStatCard(
      'Upcoming Viewings',
      formatNumber(viewingsStats.upcoming),
      CalendarIcon,
      'green',
      nextViewing
        ? `Next: ${formatDateTime(nextViewing.start_time || nextViewing.startTime)}`
        : 'Schedule a viewing to track it here.'
    ),
    createStatCard(
      'Unread Notifications',
      formatNumber(unreadNotifications),
      BellIcon,
      'yellow',
      unreadNotifications ? 'Catch up on your latest alerts.' : 'You’re all caught up!'
    )
  ];

  const recentActivity = [];

  applicationsList.slice(0, 4).forEach((app) => {
    const tone =
      app.status === 'approved'
        ? 'green'
        : app.status === 'rejected'
          ? 'red'
          : 'blue';
    recentActivity.push(
      createActivityItem(
        `Application ${app.status || 'pending'}`,
        app.property?.title || 'Rental application update',
        app.applicationDate || app.updatedAt || app.createdAt,
        tone
      )
    );
  });

  if (favorites.length) {
    recentActivity.push(
      createActivityItem(
        'Saved rental',
        favorites[0].property?.title || 'Rental saved',
        favorites[0].savedAt || favorites[0].createdAt,
        'red'
      )
    );
  }

  if (nextViewing) {
    recentActivity.push(
      createActivityItem(
        'Viewing scheduled',
        nextViewing.property?.title || 'Viewing arranged',
        nextViewing.start_time || nextViewing.startTime,
        'green'
      )
    );
  }

  return {
    statsCards,
    recentActivity: ensureRecentActivity(recentActivity)
  };
};

const buildSellerDashboardSummary = async () => {
  const response = await sellerAPI.getDashboard();
  const dashboard = response.data?.dashboard || {};
  const stats = dashboard.stats || {};
  const properties = dashboard.properties || [];
  const statsCards = [
    createStatCard(
      'Total Listings',
      formatNumber(stats.totalProperties || 0),
      BuildingOfficeIcon,
      'blue',
      `${formatNumber(stats.activeProperties || 0)} active listings`
    ),
    createStatCard(
      'Total Views',
      formatNumber(stats.totalViews || 0),
      EyeIcon,
      'green',
      `${formatNumber(stats.totalInquiries || 0)} inquiries • ${formatNumber(
        stats.totalSaves || 0
      )} saves`
    ),
    createStatCard(
      'Avg Response Time',
      formatDuration(stats.avgResponseTime),
      ChartBarIcon,
      'purple',
      stats.avgResponseTime
        ? 'Average time to respond to inquiries'
        : 'Respond faster to improve engagement.'
    ),
    createStatCard(
      'Upcoming Open Houses',
      formatNumber(stats.upcomingOpenHouses || 0),
      CalendarIcon,
      'yellow',
      stats.upcomingOpenHouses
        ? 'Finalize details for your upcoming events.'
        : 'Schedule an open house to boost visibility.'
    )
  ];

  const recentActivity = [];

  properties.slice(0, 4).forEach((property) => {
    const status = (property.status || 'pending').toLowerCase();
    const tone =
      status === 'active' ? 'green' : status === 'pending' ? 'yellow' : 'blue';
    recentActivity.push(
      createActivityItem(
        property.title || 'Listing update',
        `Status: ${property.status || 'Pending review'}`,
        property.updatedAt || property.createdAt,
        tone
      )
    );
  });

  return {
    statsCards,
    recentActivity: ensureRecentActivity(recentActivity)
  };
};

const buildAdminDashboardSummary = async (token) => {
  const response = await adminAPI.getDashboardAnalytics(token);
  const data = response.data || response;

  const users = data.users || {};
  const listings = data.listings || {};
  const reports = data.reports || {};

  const statsCards = [
    createStatCard(
      'Total Users',
      formatNumber(users.total || 0),
      UserGroupIcon,
      'blue',
      `${formatNumber(users.active || 0)} active • ${formatNumber(users.blocked || 0)} blocked`
    ),
    createStatCard(
      'Listings In Review',
      formatNumber(listings.pending || 0),
      BuildingOfficeIcon,
      'orange',
      `${formatNumber(listings.approved || 0)} approved • ${formatNumber(
        listings.rejected || 0
      )} rejected`
    ),
    createStatCard(
      'Open Reports',
      formatNumber(reports.pending || 0),
      ExclamationTriangleIcon,
      'red',
      `${formatNumber(reports.resolved || 0)} resolved`
    ),
    createStatCard(
      'Analytics Refreshed',
      data.generatedAt ? formatDateTime(data.generatedAt) : '—',
      ChartBarIcon,
      'purple',
      'Data updates automatically throughout the day.'
    )
  ];

  const recentActivity = [];

  (data.recentUsers || []).forEach((user) => {
    recentActivity.push(
      createActivityItem(
        `New ${user.userType || 'user'} joined`,
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.createdAt,
        'green'
      )
    );
  });

  (data.recentListings || []).forEach((listing) => {
    recentActivity.push(
      createActivityItem(
        `Listing ${listing.status || 'updated'}`,
        listing.title || 'Listing activity',
        listing.createdAt,
        'blue'
      )
    );
  });

  (data.recentReports || []).forEach((report) => {
    recentActivity.push(
      createActivityItem(
        `Report ${report.status || 'created'}`,
        `Type: ${report.type || 'General'}`,
        report.createdAt,
        'red'
      )
    );
  });

  recentActivity.sort((a, b) => {
    const dateA = parseDate(a.timestamp);
    const dateB = parseDate(b.timestamp);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB - dateA;
  });

  return {
    statsCards,
    recentActivity: ensureRecentActivity(recentActivity)
  };
};

const buildAgentDashboardSummary = async () => {
  const now = new Date();
  const [appointmentsRes, notificationsRes, messagesRes] = await Promise.allSettled([
    appointmentAPI.getUserAppointments({}),
    notificationAPI.getNotifications({}),
    messageAPI.getUnreadCount()
  ]);

  const appointments =
    appointmentsRes.status === 'fulfilled'
      ? appointmentsRes.value?.appointments || []
      : [];

  const upcomingAppointments = appointments
    .map((appointment) => ({
      appointment,
      start: parseDate(appointment.start_time || appointment.startTime || appointment.startDate)
    }))
    .filter(
      ({ start }) => start && start >= now
    )
    .sort((a, b) => a.start - b.start);

  const nextAppointment = upcomingAppointments[0]?.appointment;

  const notificationsPayload =
    notificationsRes.status === 'fulfilled' ? notificationsRes.value || {} : {};
  const notifications = notificationsPayload.notifications || [];
  const unreadNotifications =
    notificationsPayload.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const unreadMessages =
    messagesRes.status === 'fulfilled'
      ? messagesRes.value?.data?.unreadCount ?? messagesRes.value?.unreadCount ?? 0
      : 0;

  const statsCards = [
    createStatCard(
      'Upcoming Meetings',
      formatNumber(upcomingAppointments.length),
      CalendarIcon,
      'green',
      nextAppointment
        ? `Next: ${formatDateTime(nextAppointment.start_time || nextAppointment.startTime)}`
        : 'Schedule meetings to see them here.'
    ),
    createStatCard(
      'Unread Messages',
      formatNumber(unreadMessages),
      ChatBubbleLeftRightIcon,
      'purple',
      unreadMessages ? 'Follow up with your clients.' : 'All client threads are up to date.'
    ),
    createStatCard(
      'Unread Notifications',
      formatNumber(unreadNotifications),
      BellIcon,
      'yellow',
      unreadNotifications ? 'Review notifications for updates.' : 'No new alerts.'
    )
  ];

  const recentActivity = [];

  if (nextAppointment) {
    recentActivity.push(
      createActivityItem(
        'Upcoming appointment',
        nextAppointment.property?.title || 'Client meeting scheduled',
        nextAppointment.start_time || nextAppointment.startTime,
        'green'
      )
    );
  }

  if (appointments.length) {
    const latestAppointment = appointments
      .map((appointment) => ({
        appointment,
        timestamp:
          parseDate(appointment.updatedAt) ||
          parseDate(appointment.start_time) ||
          parseDate(appointment.startTime)
      }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

    if (latestAppointment) {
      recentActivity.push(
        createActivityItem(
          'Appointment activity',
          latestAppointment.appointment.property?.title || 'Appointment updated',
          latestAppointment.timestamp,
          'blue'
        )
      );
    }
  }

  if (notifications.length) {
    const latestNotification = notifications[0];
    recentActivity.push(
      createActivityItem(
        latestNotification.title || 'New notification',
        latestNotification.content || 'Notification received',
        latestNotification.createdAt,
        'yellow'
      )
    );
  }

  return {
    statsCards,
    recentActivity: ensureRecentActivity(recentActivity)
  };
};

const buildDefaultDashboardSummary = async (userType) => ({
  statsCards: [
    createStatCard(
      'Getting Started',
      '—',
      HomeIcon,
      'blue',
      userType
        ? `We’re preparing personalized insights for your ${userType} workspace.`
        : 'Sign in to see personalized insights.'
    )
  ],
  recentActivity: ensureRecentActivity([])
});

const DashboardPage = () => {
  const { user, token } = useSelector((state) => state.auth || {});
  const [statsCards, setStatsCards] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const userType = user?.userType;
        let summary;

        switch (userType) {
          case 'buyer':
            summary = await buildBuyerDashboardSummary();
            break;
          case 'renter':
            summary = await buildRenterDashboardSummary();
            break;
          case 'seller':
            summary = await buildSellerDashboardSummary();
            break;
          case 'admin':
            summary = await buildAdminDashboardSummary(token);
            break;
          case 'agent':
            summary = await buildAgentDashboardSummary();
            break;
          default:
            summary = await buildDefaultDashboardSummary(userType);
            break;
        }

        if (isMounted) {
          setStatsCards(summary.statsCards || []);
          setRecentActivity(summary.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load dashboard insights.');
          setStatsCards([]);
          setRecentActivity([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardSummary();

    return () => {
      isMounted = false;
    };
  }, [user?.userType, token]);

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

  const quickActions = getQuickActions(user?.userType);

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
          {error && (
            <div className="col-span-full bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && !error && statsCards.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
              Your activity will appear here once you begin engaging with the platform.
            </div>
          )}

          {!loading &&
            !error &&
            statsCards.map((stat, index) => {
              const Icon = stat.icon;
              const gradientClasses = STAT_COLOR_CLASSES[stat.color] || STAT_COLOR_CLASSES.blue;
              const iconBg = STAT_ICON_BG_CLASSES[stat.color] || STAT_ICON_BG_CLASSES.blue;

              return (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${gradientClasses} rounded-xl p-6 border flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium mb-1">{stat.name}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${iconBg}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {stat.helper && (
                    <p className="text-sm text-gray-600 mt-4">{stat.helper}</p>
                  )}
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
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="h-16 rounded-lg bg-gray-100 animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item, index) => {
                const toneClass = TONE_COLORS[item.tone] || TONE_COLORS.blue;
                return (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mr-4 ${toneClass}`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500">{item.description}</p>
                      )}
                      {item.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(item.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
