import { ArrowPathIcon, ClockIcon, FlagIcon } from '@heroicons/react/24/outline';
import { EmptyState, PageHeader, Spinner } from '../../../components/ui';
import { FilterSelect, StatusBadge, docId, formatDate } from '../shared';

const ReportsSection = ({ reports, loading, onFilter, onReset, onReview }) => {
  const { list, filters, total } = reports;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`${total || 0} reports`}
        actions={
          <>
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(status) => onFilter({ status })}
              options={[['', 'All statuses'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['dismissed', 'Dismissed']]}
            />
            <FilterSelect
              label="Type"
              value={filters.type}
              onChange={(type) => onFilter({ type })}
              options={[['', 'All types'], ['spam', 'Spam'], ['inappropriate', 'Inappropriate'], ['fake', 'Fake listing'], ['fraud', 'Fraud'], ['harassment', 'Harassment'], ['copyright', 'Copyright'], ['other', 'Other']]}
            />
            <button type="button" onClick={onReset} className="btn-ghost" aria-label="Reset filters" title="Reset filters">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </>
        }
      />

      {!list ? (
        <Spinner label="Loading reports" />
      ) : list.length === 0 ? (
        <EmptyState icon={FlagIcon} title="No reports" description="Nothing has been reported with these filters." />
      ) : (
        <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          {list.map((r) => (
            <li key={docId(r)} className="card-plain flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="badge capitalize">{r.type}</span>
                  <span className="text-xs text-gray-500">on a {String(r.reportedItemModel || 'item').toLowerCase()}</span>
                </div>
                <p className="mt-2 text-sm text-gray-800">{r.reason}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(r.createdAt)}
                  {r.reportedBy?.firstName ? ` · reported by ${r.reportedBy.firstName} ${r.reportedBy.lastName || ''}` : ''}
                </p>
                {r.adminNotes && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">Note: {r.adminNotes}</p>}
              </div>
              {r.status === 'pending' && (
                <button type="button" onClick={() => onReview(r)} className="btn-secondary flex-shrink-0">
                  Review
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportsSection;
