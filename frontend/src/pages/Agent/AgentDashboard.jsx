import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  EyeIcon,
  HomeModernIcon,
  PencilSquareIcon,
  PlusIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { EmptyState, PageHeader, Spinner, StatCard } from '../../components/ui';
import Inbox from '../../components/Seller/Inbox';
import AccountSettings from '../../components/Account/AccountSettings';
import PropertyListingWizard from '../../components/Seller/PropertyListingWizard';
import { agentAPI } from '../../services/agentAPI';
import { propertyImage } from '../../config';
import { StatusBadge } from '../Admin/shared';

const TABS = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'listings', name: 'Listings', icon: HomeModernIcon },
  { id: 'messages', name: 'Inquiries', icon: ChatBubbleLeftRightIcon },
  { id: 'profile', name: 'Profile', icon: UserCircleIcon }
];

// What an agent can move an approved listing to
const STATUS_OPTIONS = [
  ['active', 'Active'],
  ['under-contract', 'Under contract'],
  ['sold', 'Sold'],
  ['rented', 'Rented'],
  ['inactive', 'Inactive']
];

const money = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0).toLocaleString()}`;
  }
};
const place = (a) => [a?.city, a?.country].filter(Boolean).join(', ');

const ListingRow = ({ listing, me, onStatus, busy }) => {
  const pending = listing.status === 'pending';
  const ownListing = String(listing.owner?._id || listing.owner) === String(me);
  return (
    <li className="card-plain flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link to={`/properties/${listing._id}`} className="block h-40 w-full flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-20 sm:w-28">
        <img src={propertyImage(listing.photos)} alt="" className="h-full w-full object-cover" loading="lazy" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/properties/${listing._id}`} className="truncate font-semibold text-gray-900 hover:text-brand-700">{listing.title}</Link>
          <StatusBadge status={listing.status} />
          {!ownListing && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">Assigned</span>}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {money(listing.price, listing.currency)}
          {listing.listingType === 'rental' ? ' / month' : ''}
          {place(listing.address) ? ` · ${place(listing.address)}` : ''}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {ownListing ? 'Your listing' : `Owner: ${listing.owner?.firstName || ''} ${listing.owner?.lastName || ''}`}
          {' · '}
          {listing.analytics?.views || 0} views · {listing.analytics?.inquiries || 0} inquiries
        </p>
      </div>
      <div className="flex items-center gap-2">
        {pending ? (
          <span className="flex items-center gap-1 text-xs text-amber-700">
            <ClockIcon className="h-4 w-4" aria-hidden="true" /> Waiting for approval
          </span>
        ) : (
          <select
            aria-label={`Status of ${listing.title}`}
            className="input w-auto py-1.5 text-sm"
            value={listing.status}
            disabled={busy}
            onChange={(e) => onStatus(listing, e.target.value)}
          >
            {STATUS_OPTIONS.map(([v, t]) => (
              <option key={v} value={v}>{t}</option>
            ))}
          </select>
        )}
        <Link to={`/properties/${listing._id}/edit`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Edit ${listing.title}`}>
          <PencilSquareIcon className="h-5 w-5" />
        </Link>
      </div>
    </li>
  );
};

const AgentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'overview';

  const [data, setData] = useState(null);
  const [listings, setListings] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [wizard, setWizard] = useState(false);

  const loadDashboard = useCallback(() => {
    agentAPI
      .getDashboard()
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not load your dashboard'));
  }, []);

  const loadListings = useCallback(() => {
    agentAPI
      .getListings(filter === 'assigned' ? { assigned: 'true' } : filter ? { status: filter } : {})
      .then((res) => setListings(res.data.listings || []))
      .catch(() => {
        setListings([]);
        toast.error('Could not load listings');
      });
  }, [filter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    if (tab === 'listings') loadListings();
  }, [tab, loadListings]);

  const changeStatus = async (listing, status) => {
    setBusy(true);
    try {
      await agentAPI.updateStatus(listing._id, status);
      toast.success(`Marked as ${status.replace('-', ' ')}`);
      loadListings();
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update the status');
    } finally {
      setBusy(false);
    }
  };

  const select = (id) => setSearchParams(id === 'overview' ? {} : { tab: id });
  const s = data?.stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">Agent workspace</p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Hi {user?.firstName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.agent?.agency ? `${user.agent.agency} · ` : ''}
              <Link to={`/agents/${user?._id}`} className="font-medium text-brand-700 hover:underline">View public profile</Link>
            </p>
          </div>
          <button type="button" className="btn-primary self-start sm:self-auto" onClick={() => setWizard(true)}>
            <PlusIcon className="h-4 w-4" aria-hidden="true" /> New listing
          </button>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200" aria-label="Agent sections">
          {TABS.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => select(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {name}
              {id === 'messages' && s?.unreadConversations > 0 && (
                <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{s.unreadConversations}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === 'overview' &&
            (!data ? (
              <Spinner label="Loading dashboard" />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard label="Listings" value={s.totalListings} hint={`${s.assigned} assigned by admin`} icon={BriefcaseIcon} />
                  <StatCard label="Active" value={s.active} hint={`${s.pending} waiting for approval`} icon={HomeModernIcon} tone="green" />
                  <StatCard label="Closed deals" value={s.closed} hint={money(s.closedValue)} icon={CheckBadgeIcon} tone="violet" />
                  <StatCard label="Open inquiries" value={s.openConversations} hint={`${s.unreadConversations} unread`} icon={ChatBubbleLeftRightIcon} tone="blue" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard label="Views" value={s.views} icon={EyeIcon} tone="amber" />
                  <StatCard label="Saves" value={s.saves} icon={HomeModernIcon} tone="rose" />
                  <StatCard label="Under contract" value={s.underContract} icon={ClockIcon} tone="blue" />
                </div>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recently updated</h2>
                    <button type="button" className="text-sm font-medium text-brand-700 hover:underline" onClick={() => select('listings')}>
                      All listings
                    </button>
                  </div>
                  {data.recentListings.length === 0 ? (
                    <EmptyState
                      icon={HomeModernIcon}
                      title="No listings yet"
                      description="Listings an admin assigns to you, and the ones you create, show up here."
                      action={<button type="button" className="btn-primary" onClick={() => setWizard(true)}>Create a listing</button>}
                    />
                  ) : (
                    <ul className="space-y-3">
                      {data.recentListings.map((l) => (
                        <ListingRow key={l._id} listing={l} me={user?._id} onStatus={changeStatus} busy={busy} />
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ))}

          {tab === 'listings' && (
            <div className="space-y-4">
              <PageHeader
                title="Listings"
                description="Properties you represent. Update the status as deals progress."
                actions={
                  <select aria-label="Filter listings" className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="assigned">Assigned to me</option>
                    <option value="pending">Waiting for approval</option>
                    <option value="active">Active</option>
                    <option value="under-contract">Under contract</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="inactive">Inactive</option>
                  </select>
                }
              />
              {!listings ? (
                <Spinner label="Loading listings" />
              ) : listings.length === 0 ? (
                <EmptyState icon={HomeModernIcon} title="No listings" description="Nothing matches this filter." />
              ) : (
                <ul className="space-y-3">
                  {listings.map((l) => (
                    <ListingRow key={l._id} listing={l} me={user?._id} onStatus={changeStatus} busy={busy} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'messages' && (
            <div className="card-plain overflow-hidden">
              <Inbox />
            </div>
          )}

          {tab === 'profile' && <AccountSettings />}
        </div>
      </div>

      {wizard && (
        <PropertyListingWizard
          onClose={() => setWizard(false)}
          onCreated={() => {
            setWizard(false);
            loadDashboard();
            if (tab === 'listings') loadListings();
          }}
        />
      )}
    </div>
  );
};

export default AgentDashboard;
