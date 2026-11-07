import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import sellerAPI from '../../services/sellerAPI';
import { propertyImage } from '../../config';
import { EmptyState, PageHeader, StatCard, Spinner } from '../ui';

const SORTS = {
  views: { label: 'Most viewed', key: 'views' },
  inquiries: { label: 'Most inquiries', key: 'inquiries' },
  saves: { label: 'Most saved', key: 'saves' },
  conversion: { label: 'Best conversion', key: 'conversionRate' }
};

const formatNumber = (n = 0) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
const formatPrice = (n) =>
  n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('views');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await sellerAPI.getListingAnalytics();
      setData(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const listings = useMemo(() => {
    const key = SORTS[sort].key;
    return [...(data?.listings || [])].sort((a, b) => (b[key] || 0) - (a[key] || 0));
  }, [data, sort]);

  const maxViews = Math.max(1, ...listings.map((l) => l.views));
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="How your listings perform with buyers and renters."
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="btn-secondary"
            aria-label="Refresh analytics"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {loading && !data ? (
        <Spinner label="Loading analytics" />
      ) : error ? (
        <EmptyState
          icon={ChartBarIcon}
          title="Analytics unavailable"
          description={error}
          action={
            <button type="button" onClick={load} className="btn-primary">
              Try again
            </button>
          }
        />
      ) : !listings.length ? (
        <EmptyState
          icon={ChartBarIcon}
          title="No listings yet"
          description="Publish your first property to start seeing views, saves and inquiries here."
          action={
            <Link to="/properties/create" className="btn-primary">
              Create a listing
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total views" value={formatNumber(summary.views)} icon={EyeIcon} tone="blue" />
            <StatCard label="Saves" value={formatNumber(summary.saves)} icon={HeartIcon} tone="rose" />
            <StatCard
              label="Inquiries"
              value={formatNumber(summary.inquiries)}
              icon={ChatBubbleLeftRightIcon}
              tone="green"
            />
            <StatCard
              label="Inquiry rate"
              value={`${summary.conversionRate}%`}
              hint="Inquiries per view"
              icon={ChartBarIcon}
              tone="violet"
            />
          </div>

          <section className="card-plain overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Listing performance <span className="font-normal text-gray-500">({listings.length})</span>
              </h3>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="input py-1.5 text-sm">
                  {Object.entries(SORTS).map(([id, s]) => (
                    <option key={id} value={id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ul className="divide-y divide-gray-100">
              {listings.map((l) => (
                <li key={l._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                  <img
                    src={propertyImage(l.photo ? [{ url: l.photo }] : [])}
                    alt=""
                    className="h-16 w-24 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/properties/${l._id}`} className="truncate font-medium text-gray-900 hover:text-brand-600">
                        {l.title}
                      </Link>
                      <span className="badge capitalize">{l.status}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatPrice(l.price)}
                      {l.city ? ` · ${l.city}` : ''}
                    </p>
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(l.views / maxViews) * 100}%` }} />
                    </div>
                  </div>
                  <dl className="grid grid-cols-4 gap-4 text-center sm:w-80">
                    {[
                      ['Views', formatNumber(l.views)],
                      ['Saves', formatNumber(l.saves)],
                      ['Inquiries', formatNumber(l.inquiries)],
                      ['Rate', `${l.conversionRate}%`]
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-gray-500">{label}</dt>
                        <dd className="mt-0.5 font-semibold text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-gray-500">
            Views are counted each time someone other than you opens a listing. Inquiries are unique people who
            messaged you about a listing.
          </p>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
