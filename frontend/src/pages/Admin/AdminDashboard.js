import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  resetReportFilters
} from '../../store/slices/adminSlice';
import { 
  UsersIcon, 
  HomeIcon, 
  FlagIcon, 
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { 
    analytics, 
    users, 
    listings, 
    reports, 
    loading, 
    error, 
    successMessage 
  } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingUser, setEditingUser] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [editingReport, setEditingReport] = useState(null);

  // Load initial data
  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchDashboardAnalytics());
      dispatch(fetchAllUsers());
      dispatch(fetchAllListings());
      dispatch(fetchAllReports());
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

  // Handle filter changes for users
  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchAllUsers(users.filters));
    }
  }, [dispatch, user, users.filters]);

  // Handle filter changes for listings
  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchAllListings(listings.filters));
    }
  }, [dispatch, user, listings.filters]);

  // Handle filter changes for reports
  useEffect(() => {
    if (user?.userType === 'admin') {
      dispatch(fetchAllReports(reports.filters));
    }
  }, [dispatch, user, reports.filters]);

  // Handle user update
  const handleUserUpdate = async (userId, userData) => {
    try {
      await dispatch(updateUser({ userId, userData })).unwrap();
      setEditingUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  // Handle user delete
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

  // Handle listing status update
  const handleListingStatusUpdate = async (listingId, statusData) => {
    try {
      await dispatch(updateListingStatus({ listingId, statusData })).unwrap();
      setEditingListing(null);
      toast.success('Listing status updated successfully');
    } catch (error) {
      toast.error('Failed to update listing status');
    }
  };

  // Handle listing delete
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

  // Handle report resolution
  const handleReportResolution = async (reportId, resolutionData) => {
    try {
      await dispatch(resolveReport({ reportId, resolutionData })).unwrap();
      setEditingReport(null);
      toast.success('Report resolved successfully');
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  // Dashboard Analytics Component
  const DashboardAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Users Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UsersIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.users?.total || 0}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Active: {analytics.users?.active || 0} | Blocked: {analytics.users?.blocked || 0}
          </p>
        </div>
      </div>

      {/* Listings Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <HomeIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Listings</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.listings?.total || 0}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Pending: {analytics.listings?.pending || 0} | Approved: {analytics.listings?.approved || 0}
          </p>
        </div>
      </div>

      {/* Reports Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <FlagIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Reports</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.reports?.total || 0}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Pending: {analytics.reports?.pending || 0} | Resolved: {analytics.reports?.resolved || 0}
          </p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">$0</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">This month</p>
        </div>
      </div>
    </div>
  );

  // User Management Component
  const UserManagement = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col space-y-1">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <div className="text-sm text-gray-500">
              {users.total} users found
              {(users.filters.search || users.filters.role || users.filters.status) && (
                <span className="ml-2">
                  • Filters active: {[
                    users.filters.search && `Search: "${users.filters.search}"`,
                    users.filters.role && `Role: ${users.filters.role}`,
                    users.filters.status && `Status: ${users.filters.status}`
                  ].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search users..."
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
              value={users.filters.search}
              onChange={(e) => dispatch(updateUserFilters({ search: e.target.value }))}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={users.filters.role}
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={users.filters.status}
              onChange={(e) => dispatch(updateUserFilters({ status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
            <button
              onClick={() => dispatch(resetUserFilters())}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
              <tr key={userItem._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {userItem.profilePicture ? (
                        <img className="h-10 w-10 rounded-full" src={userItem.profilePicture} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
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
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {userItem.userType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit user"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUserDelete(userItem._id)}
                      className="text-red-600 hover:text-red-900"
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
        
        {/* No results message */}
        {users.list.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}
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
              handleUserUpdate(editingUser._id, userData);
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

  // Listing Management Component
  const ListingManagement = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Listing Management</h3>
          <div className="text-sm text-gray-500">
            {listings.total} listings found
            {(listings.filters.search || listings.filters.status) && (
              <span className="ml-2">
                • Filters active: {[
                  listings.filters.search && `Search: "${listings.filters.search}"`,
                  listings.filters.status && `Status: ${listings.filters.status}`
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search listings..."
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
              value={listings.filters.search}
              onChange={(e) => dispatch(updateListingFilters({ search: e.target.value }))}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={listings.filters.status}
              onChange={(e) => dispatch(updateListingFilters({ status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
            <button
              onClick={() => dispatch(resetListingFilters())}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings.list.map((listing) => (
              <tr key={listing._id}>
                <td className="px-6 py-4 whitespace-nowrap">
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
                      <div className="text-sm text-gray-500">{listing.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {listing.owner?.firstName} {listing.owner?.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    listing.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${listing.price?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingListing(listing)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit listing"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleListingDelete(listing._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete listing"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* No results message */}
        {listings.list.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No listings found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Listing Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Listing Status</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const statusData = {
                status: formData.get('status')
              };
              handleListingStatusUpdate(editingListing._id, statusData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    defaultValue={editingListing.status}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
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

  // Reports Management Component
  const ReportsManagement = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Reports & Moderation</h3>
          <div className="text-sm text-gray-500">
            {reports.total} reports found
            {(reports.filters.status || reports.filters.type) && (
              <span className="ml-2">
                • Filters active: {[
                  reports.filters.status && `Status: ${reports.filters.status}`,
                  reports.filters.type && `Type: ${reports.filters.type}`
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={reports.filters.status}
              onChange={(e) => dispatch(updateReportFilters({ status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={reports.filters.type}
              onChange={(e) => dispatch(updateReportFilters({ type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="fake">Fake</option>
              <option value="harassment">Harassment</option>
              <option value="copyright">Copyright</option>
              <option value="fraud">Fraud</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={() => dispatch(resetReportFilters())}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.list.map((report) => (
              <tr key={report._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded bg-red-100 flex items-center justify-center">
                        <FlagIcon className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Reported by {report.reportedBy?.firstName} {report.reportedBy?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{report.reason}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {report.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {report.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingReport(report)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View report details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* No results message */}
        {reports.list.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No reports found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Report Resolution Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resolve Report</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Reported by:</strong> {editingReport.reportedBy?.firstName} {editingReport.reportedBy?.lastName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Type:</strong> {editingReport.type}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Reason:</strong> {editingReport.reason}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Priority:</strong> {editingReport.priority}
              </p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const resolutionData = {
                status: formData.get('status'),
                adminNotes: formData.get('adminNotes'),
                action: formData.get('action')
              };
              handleReportResolution(editingReport._id, resolutionData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Status</label>
                  <select
                    name="status"
                    defaultValue={editingReport.status}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action Taken</label>
                  <select
                    name="action"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select action</option>
                    <option value="warning">Warning</option>
                    <option value="suspension">Suspension</option>
                    <option value="ban">Ban</option>
                    <option value="content_removal">Content Removal</option>
                    <option value="no_action">No Action</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                  <textarea
                    name="adminNotes"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Add notes about the resolution..."
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Resolve Report
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
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

  // Main Component
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users, listings, and platform content</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
              { id: 'users', name: 'Users', icon: UsersIcon },
              { id: 'listings', name: 'Listings', icon: HomeIcon },
              { id: 'reports', name: 'Reports', icon: FlagIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'dashboard' && <DashboardAnalytics />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'listings' && <ListingManagement />}
          {activeTab === 'reports' && <ReportsManagement />}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
