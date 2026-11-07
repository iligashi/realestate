import {
  CurrencyDollarIcon,
  FlagIcon,
  HomeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { StatCard } from '../../../components/ui';
import { formatCurrency } from '../shared';

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

const Panel = ({ title, icon: Icon, children }) => (
  <section className="card">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {Icon && <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
    </div>
    {children}
  </section>
);

const OverviewSection = ({ user, analytics, revenue }) => {
  const recentActivity = [
    ...(analytics.recentUsers || []).map((u) => ({
      key: `user-${u._id}`,
      dot: 'bg-emerald-500',
      text: `${u.firstName} ${u.lastName} joined as ${u.userType}`,
      date: u.createdAt
    })),
    ...(analytics.recentListings || []).map((l) => ({
      key: `listing-${l._id}`,
      dot: 'bg-sky-500',
      text: `New listing: ${l.title}`,
      date: l.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const roles = analytics.roleDistribution || [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-7 text-white shadow-sm">
        <p className="text-sm font-medium text-brand-100">Admin overview</p>
        <h1 className="mt-1 text-2xl font-bold">Welcome back, {user?.firstName || 'Admin'}</h1>
        <p className="mt-1 text-sm text-brand-100">
          {analytics.listings?.pending
            ? `${analytics.listings.pending} listing${analytics.listings.pending > 1 ? 's' : ''} and ${analytics.reports?.pending || 0} report(s) need your review.`
            : 'Everything is reviewed. Nice work.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={analytics.users?.total || 0}
          hint={`${analytics.users?.blocked || 0} blocked`}
          icon={UsersIcon}
          tone="blue"
        />
        <StatCard
          label="Listings"
          value={analytics.listings?.total || 0}
          hint={`${analytics.listings?.pending || 0} pending review`}
          icon={HomeIcon}
          tone="green"
        />
        <StatCard
          label="Reports"
          value={analytics.reports?.total || 0}
          hint={`${analytics.reports?.pending || 0} pending`}
          icon={FlagIcon}
          tone="rose"
        />
        <StatCard
          label="Featured revenue"
          value={formatCurrency(revenue?.featuredListingRevenue)}
          hint={`${revenue?.featuredListingsSold || 0} featured · 30 days`}
          icon={CurrencyDollarIcon}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Recent activity">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={item.key} className="flex items-center gap-3">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900">{item.text}</span>
                  <span className="flex-shrink-0 text-xs text-gray-500">{timeAgo(item.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Users by role" icon={UserGroupIcon}>
          {roles.length === 0 ? (
            <p className="text-sm text-gray-500">No users yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {roles.map((role) => (
                <div key={role._id} className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xl font-bold tabular-nums text-gray-900">{role.count}</p>
                  <p className="text-xs capitalize text-gray-600">{role._id}s</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Listings by status" icon={ShieldCheckIcon}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Pending review', analytics.listings?.pending, 'text-amber-600'],
            ['Active', analytics.listings?.approved, 'text-emerald-600'],
            ['Inactive', analytics.listings?.rejected, 'text-gray-600']
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value || 0}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

export default OverviewSection;
