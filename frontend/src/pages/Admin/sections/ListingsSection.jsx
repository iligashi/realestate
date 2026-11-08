import { Link } from 'react-router-dom';
import { ArrowPathIcon, HomeIcon, PencilSquareIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { EmptyState, PageHeader, Spinner } from '../../../components/ui';
import { propertyImage } from '../../../config';
import { FilterSelect, SearchInput, StatusBadge, docId, formatCurrency } from '../shared';

const ListingsSection = ({ listings, loading, onFilter, onReset, onEdit, onAssign, onDelete }) => {
  const { list, filters, total } = listings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description={`${total || 0} listings`}
        actions={
          <>
            <SearchInput value={filters.search} onSearch={(search) => onFilter({ search })} placeholder="Search title or city" label="Search listings" />
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(status) => onFilter({ status })}
              options={[['', 'All statuses'], ['pending', 'Pending review'], ['active', 'Active'], ['under-contract', 'Under contract'], ['sold', 'Sold'], ['rented', 'Rented'], ['inactive', 'Inactive']]}
            />
            <FilterSelect
              label="Type"
              value={filters.propertyType}
              onChange={(propertyType) => onFilter({ propertyType })}
              options={[['', 'All types'], ['house', 'Houses'], ['apartment', 'Apartments'], ['office', 'Offices']]}
            />
            <button type="button" onClick={onReset} className="btn-ghost" aria-label="Reset filters" title="Reset filters">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </>
        }
      />

      {!list ? (
        <Spinner label="Loading listings" />
      ) : list.length === 0 ? (
        <EmptyState icon={HomeIcon} title="No listings found" description="Try a different search or clear the filters." />
      ) : (
        <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {list.map((l) => (
            <article key={docId(l)} className="card-plain group overflow-hidden">
              <Link to={`/properties/${docId(l)}`} className="block aspect-[16/10] overflow-hidden bg-gray-100">
                <img src={propertyImage(l.photos)} alt={l.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </Link>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate font-semibold text-gray-900">{l.title}</h3>
                  <StatusBadge status={l.status} />
                </div>
                <p className="mt-1 text-sm capitalize text-gray-500">
                  {l.propertyType}
                  {l.address?.city ? ` · ${l.address.city}` : ''}
                </p>
                <p className="mt-2 truncate text-xs text-gray-500">
                  {l.agent ? (
                    <>Agent: <span className="font-medium text-gray-700">{l.agent.firstName} {l.agent.lastName}</span></>
                  ) : (
                    <>Owner: {l.owner ? `${l.owner.firstName} ${l.owner.lastName}` : '—'} · no agent</>
                  )}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(l.price)}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onEdit(l)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Change status of ${l.title}`}>
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => onAssign(l)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Assign agent to ${l.title}`} title="Assign agent">
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => onDelete(docId(l))} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${l.title}`}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingsSection;
