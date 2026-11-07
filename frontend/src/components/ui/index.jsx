// Shared building blocks so every screen looks and behaves the same.

export const Spinner = ({ label = 'Loading', className = '' }) => (
  <div className={`flex items-center justify-center py-16 ${className}`} role="status" aria-label={label}>
    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
    <span className="sr-only">{label}</span>
  </div>
);

export const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  blue: 'bg-sky-50 text-sky-600',
  green: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600'
};

export const StatCard = ({ label, value, hint, icon: Icon, tone = 'brand' }) => (
  <div className="card-plain p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
      {Icon && (
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${TONES[tone] || TONES.brand}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="card-plain flex flex-col items-center px-6 py-14 text-center">
    {Icon && (
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
    )}
    <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
