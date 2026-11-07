import { ArrowPathIcon, FlagIcon, PencilSquareIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import { EmptyState, PageHeader, Spinner } from '../../../components/ui';
import { assetUrl } from '../../../config';
import { FilterSelect, SearchInput, StatusBadge, docId, formatDate } from '../shared';

const UsersSection = ({ users, loading, onFilter, onReset, onEdit, onReport, onDelete }) => {
  const { list, filters, total } = users;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`${total || 0} users`}
        actions={
          <>
            <SearchInput value={filters.search} onSearch={(search) => onFilter({ search })} placeholder="Search name or email" label="Search users" />
            <FilterSelect
              label="Role"
              value={filters.role}
              onChange={(role) => onFilter({ role })}
              options={[['', 'All roles'], ['buyer', 'Buyers'], ['seller', 'Sellers'], ['renter', 'Renters'], ['agent', 'Agents'], ['admin', 'Admins']]}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(status) => onFilter({ status })}
              options={[['', 'All statuses'], ['active', 'Active'], ['blocked', 'Blocked']]}
            />
            <button type="button" onClick={onReset} className="btn-ghost" aria-label="Reset filters" title="Reset filters">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </>
        }
      />

      {!list ? (
        <Spinner label="Loading users" />
      ) : list.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try a different search or clear the filters." />
      ) : (
        <div className={`card-plain overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50/80 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((u) => (
                  <tr key={docId(u)} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.profilePicture ? (
                          <img className="h-9 w-9 rounded-full object-cover" src={assetUrl(u.profilePicture)} alt="" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {u.firstName?.[0]}
                            {u.lastName?.[0]}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="truncate text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-700">{u.userType}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.isBlocked ? 'blocked' : 'active'} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => onEdit(u)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Edit ${u.firstName}`}>
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => onReport(u)} className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-700" aria-label={`Report ${u.firstName}`}>
                          <FlagIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => onDelete(docId(u))} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${u.firstName}`}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersSection;
