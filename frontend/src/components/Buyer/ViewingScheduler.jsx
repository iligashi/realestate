import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import {
  getUserAppointments,
  confirmAppointment,
  cancelAppointment
} from '../../services/appointmentAPI';
import { assetUrl } from '../../config';

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' }
];

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rescheduled: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-700',
  completed: 'bg-indigo-100 text-indigo-800',
  no_show: 'bg-red-100 text-red-800'
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.state].filter(Boolean).join(', ');
};

const ViewingScheduler = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserAppointments({ type: 'viewing' });
      setAppointments(data.appointments || []);
    } catch (error) {
      toast.error('Could not load your viewings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const now = Date.now();
    return appointments.filter((a) => {
      const start = new Date(a.startTime).getTime();
      if (filter === 'upcoming') return ACTIVE_STATUSES.includes(a.status) && start >= now;
      if (filter === 'pending') return a.status === 'pending';
      if (filter === 'past') return start < now && a.status !== 'cancelled';
      return a.status === 'cancelled';
    });
  }, [appointments, filter]);

  const runAction = async (id, action, successMessage) => {
    setBusyId(id);
    try {
      await action();
      toast.success(successMessage);
      await load();
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (appointment) => {
    if (!window.confirm('Cancel this viewing?')) return;
    runAction(appointment._id, () => cancelAppointment(appointment._id), 'Viewing cancelled');
  };

  const handleConfirm = (appointment) =>
    runAction(appointment._id, () => confirmAppointment(appointment._id), 'Viewing confirmed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Viewings</h2>
          <p className="mt-1 text-gray-600">
            Viewings you requested and requests for your listings. Book a new viewing from any
            property page.
          </p>
        </div>
        <Link
          to="/properties"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Browse properties
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter viewings">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12" role="status" aria-label="Loading viewings">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <CalendarIcon className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 font-medium text-gray-900">No viewings here yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Open a property and choose &quot;Schedule Viewing&quot; to book one.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((a) => {
            const isHost = String(a.host?._id || a.host) === String(user?._id);
            const otherParty = isHost ? a.requester : a.host;
            const photo = a.property?.photos?.[0]?.url;
            const canAct = ACTIVE_STATUSES.includes(a.status) && new Date(a.startTime) > new Date();

            return (
              <li key={a._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="h-28 w-full flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-40">
                    {photo ? (
                      <img src={assetUrl(photo)} alt={a.property?.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">No photo</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        {a.property?._id ? (
                          <Link to={`/properties/${a.property._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                            {a.property.title}
                          </Link>
                        ) : (
                          <p className="font-semibold text-gray-900">{a.title || 'Property viewing'}</p>
                        )}
                        {a.property?.address && (
                          <p className="mt-0.5 flex items-center text-sm text-gray-500">
                            <MapPinIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{formatAddress(a.property.address)}</span>
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {new Date(a.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="mr-1 h-4 w-4" />
                        {new Date(a.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {a.duration ? ` (${a.duration} min)` : ''}
                      </span>
                      {otherParty?.firstName && (
                        <span className="flex items-center">
                          <UserIcon className="mr-1 h-4 w-4" />
                          {isHost ? 'Requested by' : 'With'} {otherParty.firstName} {otherParty.lastName}
                        </span>
                      )}
                    </div>

                    {canAct && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {isHost && a.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === a._id}
                            onClick={() => handleConfirm(a)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === a._id}
                          onClick={() => handleCancel(a)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel viewing
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ViewingScheduler;
