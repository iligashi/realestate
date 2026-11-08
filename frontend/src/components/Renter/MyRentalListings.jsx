import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HomeModernIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { propertyAPI } from '../../services/api';
import { propertyImage } from '../../config';
import { EmptyState, Spinner } from '../ui';
import { StatusBadge } from '../../pages/Admin/shared';

// Rentals the renter has posted themselves (a room, a sublet)
const MyRentalListings = () => {
  const [items, setItems] = useState(null);

  const load = () =>
    propertyAPI
      .getUserProperties()
      .then((res) => setItems(res.data.properties || []))
      .catch(() => {
        setItems([]);
        toast.error('Could not load your listings');
      });

  useEffect(() => {
    load();
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    try {
      await propertyAPI.deleteProperty(p._id);
      toast.success('Listing deleted');
      load();
    } catch {
      toast.error('Could not delete the listing');
    }
  };

  const toggle = async (p) => {
    const status = p.status === 'active' ? 'inactive' : 'active';
    try {
      await propertyAPI.updateProperty(p._id, { status });
      toast.success(status === 'active' ? 'Listing is live again' : 'Listing hidden');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update the listing');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My listings</h2>
          <p className="text-sm text-gray-500">Rooms or places you are renting out.</p>
        </div>
        <Link to="/properties/create-rental" className="btn-primary">
          <PlusIcon className="h-4 w-4" aria-hidden="true" /> New
        </Link>
      </div>

      {!items ? (
        <Spinner label="Loading listings" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HomeModernIcon}
          title="You have not listed anything yet"
          description="Have a spare room or need someone to take over your lease? List it here."
          action={<Link to="/properties/create-rental" className="btn-primary">List a rental</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p._id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center">
              <Link to={`/properties/${p._id}`} className="block h-36 w-full flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-16 sm:w-24">
                <img src={propertyImage(p.photos)} alt="" className="h-full w-full object-cover" loading="lazy" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/properties/${p._id}`} className="truncate font-medium text-gray-900 hover:text-brand-700">{p.title}</Link>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {p.currency || 'USD'} {Number(p.rentalDetails?.monthlyRent || p.price || 0).toLocaleString()} / month
                  {p.address?.city ? ` · ${p.address.city}` : ''}
                  {p.status === 'pending' ? ' · waiting for approval' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {['active', 'inactive'].includes(p.status) && (
                  <button type="button" className="btn-ghost text-sm" onClick={() => toggle(p)}>
                    {p.status === 'active' ? 'Hide' : 'Show'}
                  </button>
                )}
                <Link to={`/properties/${p._id}/edit`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Edit ${p.title}`}>
                  <PencilSquareIcon className="h-5 w-5" />
                </Link>
                <button type="button" onClick={() => remove(p)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${p.title}`}>
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyRentalListings;
