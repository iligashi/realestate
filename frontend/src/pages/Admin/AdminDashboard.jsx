import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bars3Icon,
  ChartBarIcon,
  ChartPieIcon,
  EnvelopeIcon,
  FlagIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  fetchDashboardAnalytics,
  fetchAllUsers,
  fetchAllListings,
  fetchAllReports,
  fetchEnhancedAnalytics,
  fetchRevenueAnalytics,
  updateUser,
  deleteUser,
  updateListingStatus,
  deleteListing,
  resolveReport,
  updateUserFilters,
  updateListingFilters,
  updateReportFilters,
  resetUserFilters,
  resetListingFilters,
  resetReportFilters,
  clearError,
  clearSuccessMessage
} from '../../store/slices/adminSlice';
import ReportForm from '../../components/ReportForm';
import OverviewSection from './sections/OverviewSection';
import UsersSection from './sections/UsersSection';
import ListingsSection from './sections/ListingsSection';
import ReportsSection from './sections/ReportsSection';
import AnalyticsSection from './sections/AnalyticsSection';
import MessagesSection from './sections/MessagesSection';
import { EditListingModal, EditUserModal, ReviewReportModal } from './AdminModals';
import { docId } from './shared';

const NAV = [
  { id: 'dashboard', name: 'Overview', icon: ChartBarIcon },
  { id: 'users', name: 'Users', icon: UsersIcon },
  { id: 'listings', name: 'Listings', icon: HomeIcon },
  { id: 'reports', name: 'Reports', icon: FlagIcon },
  { id: 'analytics', name: 'Analytics', icon: ChartPieIcon },
  { id: 'messages', name: 'Messages', icon: EnvelopeIcon }
];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { analytics, revenueAnalytics, enhancedAnalytics, users, listings, reports, loading, error, successMessage } =
    useSelector((state) => state.admin);
  const { user } = useSelector((state) => state.auth);

  const activeTab = NAV.some((n) => n.id === searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [reviewingReport, setReviewingReport] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.userType === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    dispatch(fetchDashboardAnalytics());
    dispatch(fetchEnhancedAnalytics());
    dispatch(fetchRevenueAnalytics());
  }, [dispatch, isAdmin]);

  // Lists refetch when their filters change (search is debounced in the section)
  useEffect(() => {
    if (isAdmin) dispatch(fetchAllUsers(users.filters));
  }, [dispatch, isAdmin, users.filters]);
  useEffect(() => {
    if (isAdmin) dispatch(fetchAllListings(listings.filters));
  }, [dispatch, isAdmin, listings.filters]);
  useEffect(() => {
    if (isAdmin) dispatch(fetchAllReports(reports.filters));
  }, [dispatch, isAdmin, reports.filters]);

  useEffect(() => {
    if (successMessage) dispatch(clearSuccessMessage());
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Something went wrong');
      dispatch(clearError());
    }
  }, [successMessage, error, dispatch]);

  const selectTab = (id) => {
    setSearchParams(id === 'dashboard' ? {} : { tab: id });
    setSidebarOpen(false);
  };

  // Runs an admin action, shows feedback and refreshes the overview numbers
  const run = useCallback(
    async (thunk, message, after) => {
      setSaving(true);
      try {
        await dispatch(thunk).unwrap();
        toast.success(message);
        after?.();
        dispatch(fetchDashboardAnalytics());
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Action failed. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [dispatch]
  );

  const confirmDelete = (what, thunk) => {
    if (window.confirm(`Delete this ${what}? This cannot be undone.`)) run(thunk, `${what[0].toUpperCase()}${what.slice(1)} deleted`);
  };

  const content = {
    dashboard: <OverviewSection user={user} analytics={analytics} revenue={revenueAnalytics} />,
    users: (
      <UsersSection
        users={users}
        loading={loading}
        onFilter={(f) => dispatch(updateUserFilters(f))}
        onReset={() => dispatch(resetUserFilters())}
        onEdit={setEditingUser}
        onReport={setReportingUser}
        onDelete={(id) => confirmDelete('user', deleteUser(id))}
      />
    ),
    listings: (
      <ListingsSection
        listings={listings}
        loading={loading}
        onFilter={(f) => dispatch(updateListingFilters(f))}
        onReset={() => dispatch(resetListingFilters())}
        onEdit={setEditingListing}
        onDelete={(id) => confirmDelete('listing', deleteListing(id))}
      />
    ),
    reports: (
      <ReportsSection
        reports={reports}
        loading={loading}
        onFilter={(f) => dispatch(updateReportFilters(f))}
        onReset={() => dispatch(resetReportFilters())}
        onReview={setReviewingReport}
      />
    ),
    analytics: <AnalyticsSection enhanced={enhancedAnalytics} revenue={revenueAnalytics} />,
    messages: <MessagesSection />
  }[activeTab];

  const nav = (
    <nav className="space-y-1 px-3 py-4" aria-label="Admin sections">
      {NAV.map(({ id, name, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => selectTab(id)}
          aria-current={activeTab === id ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            activeTab === id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {name}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <h1 className="text-base font-semibold text-gray-900">Admin</h1>
        </div>
        {nav}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
              <h1 className="text-base font-semibold text-gray-900">Admin</h1>
              <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close menu">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Open menu">
            <Bars3Icon className="h-5 w-5" />
          </button>
          <span className="ml-2 font-semibold text-gray-900">{NAV.find((n) => n.id === activeTab)?.name}</span>
        </div>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{content}</main>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          saving={saving}
          onClose={() => setEditingUser(null)}
          onSave={(userData) => run(updateUser({ userId: docId(editingUser), userData }), 'User updated', () => setEditingUser(null))}
        />
      )}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          saving={saving}
          onClose={() => setEditingListing(null)}
          onSave={(statusData) =>
            run(updateListingStatus({ listingId: docId(editingListing), statusData }), 'Listing updated', () => setEditingListing(null))
          }
        />
      )}
      {reviewingReport && (
        <ReviewReportModal
          report={reviewingReport}
          saving={saving}
          onClose={() => setReviewingReport(null)}
          onSave={(resolutionData) =>
            run(resolveReport({ reportId: docId(reviewingReport), resolutionData }), 'Report updated', () => setReviewingReport(null))
          }
        />
      )}
      {reportingUser && (
        <ReportForm isOpen onClose={() => setReportingUser(null)} reportedItem={reportingUser} reportedItemType="User" />
      )}
    </div>
  );
};

export default AdminDashboard;
