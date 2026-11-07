import { ChartBarIcon } from '@heroicons/react/24/outline';
import { EmptyState, PageHeader, Spinner } from '../../../components/ui';
import { formatCurrency } from '../shared';

const BarList = ({ rows, format = (v) => v, empty = 'No data yet.' }) => {
  if (!rows?.length) return <p className="text-sm text-gray-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm">
            <span className="truncate capitalize text-gray-700">{r.label}</span>
            <span className="ml-3 font-medium tabular-nums text-gray-900">{format(r.value)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const Panel = ({ title, description, children }) => (
  <section className="card">
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
    <div className="mt-5">{children}</div>
  </section>
);

const AnalyticsSection = ({ enhanced, revenue }) => {
  if (!enhanced) return <Spinner label="Loading analytics" />;

  const signups = (enhanced.userGrowth || []).reduce((sum, d) => sum + d.count, 0);
  const newListings = (enhanced.listingPerformance || []).reduce((sum, d) => sum + d.count, 0);
  const hasData = signups || newListings || enhanced.trends?.topPropertyTypes?.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Platform activity over the last 30 days." />

      {!hasData ? (
        <EmptyState icon={ChartBarIcon} title="Not enough data yet" description="Charts appear once users sign up and publish listings." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['New users', signups],
              ['New listings', newListings],
              ['Featured revenue', formatCurrency(revenue?.featuredListingRevenue)]
            ].map(([label, value]) => (
              <div key={label} className="card-plain p-5">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Listings by type">
              <BarList rows={(enhanced.trends?.topPropertyTypes || []).map((t) => ({ label: `${t._id}s`, value: t.count }))} />
            </Panel>
            <Panel title="Top locations" description="Cities with the most listings">
              <BarList rows={(enhanced.trends?.topLocations || []).map((t) => ({ label: t._id, value: t.count }))} />
            </Panel>
            <Panel title="Sign-ups per day">
              <BarList rows={(enhanced.userGrowth || []).slice(-10).map((d) => ({ label: d._id, value: d.count }))} empty="No sign-ups in this period." />
            </Panel>
            <Panel title="Featured revenue by month">
              <BarList
                rows={(revenue?.monthlyRevenue || []).map((m) => ({ label: m.month, value: m.revenue }))}
                format={formatCurrency}
                empty="No featured listings sold yet."
              />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsSection;
