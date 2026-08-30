import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  ArrowPathIcon,
  InboxArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { propertyAPI } from '../../services/api';
import rentalApplicationAPI from '../../services/rentalApplicationAPI';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  draft: 'bg-slate-50 text-slate-600 ring-slate-200',
  rented: 'bg-blue-50 text-blue-700 ring-blue-200',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200'
};

const applicationStatusConfig = {
  pending: { label: 'Pending', icon: ClockIcon, tone: 'text-amber-600 bg-amber-50' },
  approved: { label: 'Approved', icon: CheckCircleIcon, tone: 'text-emerald-600 bg-emerald-50' },
  rejected: { label: 'Rejected', icon: XCircleIcon, tone: 'text-rose-600 bg-rose-50' },
  withdrawn: { label: 'Withdrawn', icon: PaperAirplaneIcon, tone: 'text-slate-600 bg-slate-100' }
};

const RenterManagedRentals = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth || {});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [expandedPropertyId, setExpandedPropertyId] = useState(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState(null);

  const canEditListings = ['seller', 'agent', 'admin', 'renter'].includes(user?.userType);

  const normalizeAddress = (address) => {
    if (!address) return 'Unknown location';
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch (error) {
        return address;
      }
    }
    const { street, city, state, zipCode, country } = address;
    return [street, city, state, zipCode, country].filter(Boolean).join(', ') || 'Unknown location';
  };

  const normalizeProperty = (property) => {
    if (!property) return property;
    const normalized = { ...property };
    normalized.addressLabel = normalizeAddress(normalized.address);
    if (normalized.rentalDetails && typeof normalized.rentalDetails === 'string') {
      try {
        normalized.rentalDetails = JSON.parse(normalized.rentalDetails);
      } catch (error) {
        normalized.rentalDetails = null;
      }
    }
    if (normalized.details && typeof normalized.details === 'string') {
      try {
        normalized.details = JSON.parse(normalized.details);
      } catch (error) {
        normalized.details = null;
      }
    }
    return normalized;
  };

  const normalizeApplication = (application) => {
    if (!application) return application;
    const normalized = { ...application };
    normalized.status = (normalized.status || 'pending').toLowerCase();
    if (normalized.property) {
      normalized.property = {
        ...normalized.property,
        addressLabel: normalizeAddress(normalized.property.address)
      };
    }
    if (normalized.applicant) {
      normalized.applicantName = [
        normalized.applicant.firstName || normalized.applicant.first_name,
        normalized.applicant.lastName || normalized.applicant.last_name
      ]
        .filter(Boolean)
        .join(' ');
    }
    return normalized;
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [propertyResponse, landlordApplications] = await Promise.all([
        propertyAPI.getUserProperties(token),
        rentalApplicationAPI.getLandlordApplications({ limit: 100 })
      ]);

      const propertyList =
        propertyResponse?.data?.properties ||
        propertyResponse?.properties ||
        [];

      const normalizedProperties = propertyList.map(normalizeProperty);

      const normalizedApplications = (landlordApplications?.applications || []).map(normalizeApplication);

      setProperties(normalizedProperties);
      setApplications(normalizedApplications);
    } catch (error) {
      console.error('Failed to load managed rentals:', error);
      toast.error(error?.response?.data?.error || 'Failed to load your rental listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applicationsByProperty = useMemo(() => {
    const map = new Map();
    applications.forEach((application) => {
      const propertyId = application.property?.id || application.property_id;
      if (!propertyId) return;
      if (!map.has(propertyId)) {
        map.set(propertyId, []);
      }
      map.get(propertyId).push(application);
    });
    return map;
  }, [applications]);

  const handleToggleApplications = (propertyId) => {
    setExpandedPropertyId((current) => (current === propertyId ? null : propertyId));
  };

  const handleViewListing = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  const handleEditListing = (propertyId) => {
    if (!canEditListings) {
      toast.info('You do not have permission to edit listings.');
      return;
    }
    navigate(`/properties/${propertyId}/edit`, { state: { from: '/renter' } });
  };

  const handleDeleteListing = async (propertyId) => {
    if (!window.confirm('Remove this listing? This cannot be undone.')) {
      return;
    }
    setDeletingPropertyId(propertyId);
    try {
      await propertyAPI.deleteProperty(propertyId, token);
      toast.success('Listing removed successfully');
      setProperties((prev) => prev.filter((property) => property.id !== propertyId));
    } catch (error) {
      console.error('Delete listing error:', error);
      toast.error(error?.response?.data?.error || 'Failed to delete listing');
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading your rental listings…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <BuildingOffice2Icon className="h-4 w-4" />
            Your rental listings
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">Manage Listings</h2>
          <p className="text-sm text-gray-500">
            Update details, keep track of applicants, and keep your listings fresh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/properties/create-rental')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <InboxArrowDownIcon className="h-4 w-4" />
            Add new rental
          </button>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <HomeIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No rentals yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Publish your first rental listing to start receiving applications from renters.
          </p>
          <button
            onClick={() => navigate('/properties/create-rental')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <PlusIcon className="h-4 w-4" />
            Create rental listing
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map((property) => {
            const propertyId = property.id || property._id;
            const propertyApplications = applicationsByProperty.get(propertyId) || [];
            const statusKey = (property.status || 'active').toLowerCase();
            const statusClass = statusColors[statusKey] || statusColors.active;
            const rentalDetails = property.rentalDetails || {};
            const bedrooms = property.details?.bedrooms;
            const bathrooms = property.details?.bathrooms;
            const isExpanded = expandedPropertyId === propertyId;

            return (
              <div
                key={propertyId}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass}`}>
                        <span className="flex h-2 w-2 rounded-full bg-current" />
                        {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <CurrencyDollarIcon className="h-4 w-4 text-emerald-600" />
                        {formatCurrency(rentalDetails.monthlyRent ?? property.price)} / month
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                        <UsersIcon className="h-4 w-4 text-blue-600" />
                        {propertyApplications.length} application{propertyApplications.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{property.title || 'Untitled property'}</h3>
                      <p className="mt-1 text-sm text-gray-500">{property.addressLabel}</p>
                    </div>

                    <div className="grid gap-3 text-xs text-gray-500 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-gray-500">Bedrooms</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{bedrooms ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-gray-500">Bathrooms</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{bathrooms ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-gray-500">Listed</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{formatDate(property.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 self-start">
                    <button
                      onClick={() => handleViewListing(propertyId)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View listing
                    </button>
                    <button
                      onClick={() => handleToggleApplications(propertyId)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        isExpanded
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <UsersIcon className="h-4 w-4" />
                      Applications
                      {propertyApplications.length > 0 && (
                        <span className="ml-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-600 px-2 text-xs font-semibold text-white">
                          {propertyApplications.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditListing(propertyId)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canEditListings}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit listing
                    </button>
                    <button
                      onClick={() => handleDeleteListing(propertyId)}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(deletingPropertyId)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deletingPropertyId === propertyId ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900">Applications</h4>
                    {propertyApplications.length === 0 ? (
                      <p className="mt-3 text-sm text-gray-500">
                        No applications have been received for this listing yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {propertyApplications.map((application) => {
                          const statusInfo = applicationStatusConfig[application.status] || applicationStatusConfig.pending;
                          const StatusIcon = statusInfo.icon;

                          return (
                            <div
                              key={application.id}
                              className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex sm:items-center sm:justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {application.applicantName || 'Unnamed applicant'}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusInfo.tone}`}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  Applied {formatDate(application.applicationDate || application.application_date)}
                                </p>
                                {application.applicant?.email && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    Contact: {application.applicant.email} • {application.applicant.phone || 'No phone'}
                                  </p>
                                )}
                              </div>
                              <div className="mt-4 flex gap-3 text-xs text-gray-500 sm:mt-0 sm:flex-col sm:items-end">
                                <div>
                                  <span className="font-medium text-gray-700">Move-in:</span>{' '}
                                  {formatDate(application.rentalInfo?.desiredMoveInDate)}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Lease:</span>{' '}
                                  {application.rentalInfo?.leaseDuration
                                    ? `${application.rentalInfo.leaseDuration} months`
                                    : 'N/A'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RenterManagedRentals;

