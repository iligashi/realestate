import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, EnvelopeIcon, HomeModernIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { EmptyState, Spinner } from '../../components/ui';
import { agentAPI } from '../../services/agentAPI';
import { propertyImage } from '../../config';
import { StatusBadge } from '../Admin/shared';
import { AgentAvatar } from './AgentsPage';

const money = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0).toLocaleString()}`;
  }
};

const AgentProfilePage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setData(null);
    setMissing(false);
    agentAPI
      .getAgent(id)
      .then((res) => setData(res.data))
      .catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={HomeModernIcon}
          title="Agent not found"
          description="This agent profile is not available."
          action={<Link to="/agents" className="btn-primary">All agents</Link>}
        />
      </div>
    );
  }
  if (!data) return <Spinner label="Loading agent" />;

  const { agent, listings } = data;
  const info = agent.agent || {};
  const active = listings.filter((l) => l.status === 'active' || l.status === 'under-contract');
  const closed = listings.filter((l) => l.status === 'sold' || l.status === 'rented');

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link to="/agents" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> All agents
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="card-plain h-fit p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-4 lg:flex-col lg:text-center">
              <AgentAvatar agent={agent} size="h-20 w-20 text-2xl lg:h-24 lg:w-24" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{agent.firstName} {agent.lastName}</h1>
                <p className="text-sm text-gray-500">{info.agency || agent.company || 'Independent agent'}</p>
                {agent.location?.city && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 lg:justify-center">
                    <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" /> {agent.location.city}
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-2 border-y border-gray-100 py-4 text-center">
              <div><dt className="text-xs text-gray-500">Active</dt><dd className="font-semibold">{active.length}</dd></div>
              <div><dt className="text-xs text-gray-500">Closed</dt><dd className="font-semibold">{closed.length}</dd></div>
              <div><dt className="text-xs text-gray-500">Experience</dt><dd className="font-semibold">{info.experience ? `${info.experience} yr` : '—'}</dd></div>
            </dl>

            {agent.bio && <p className="mt-4 whitespace-pre-line text-sm text-gray-600">{agent.bio}</p>}

            <dl className="mt-4 space-y-2 text-sm">
              {info.languages?.length > 0 && (
                <div><dt className="inline text-gray-500">Languages: </dt><dd className="inline text-gray-800">{info.languages.join(', ')}</dd></div>
              )}
              {info.specializations?.length > 0 && (
                <div><dt className="inline text-gray-500">Focus: </dt><dd className="inline text-gray-800">{info.specializations.join(', ')}</dd></div>
              )}
              {info.licenseNumber && (
                <div><dt className="inline text-gray-500">License: </dt><dd className="inline text-gray-800">{info.licenseNumber}</dd></div>
              )}
            </dl>

            <div className="mt-6 flex flex-col gap-2">
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="btn-primary justify-center">
                  <EnvelopeIcon className="h-4 w-4" aria-hidden="true" /> Email {agent.firstName}
                </a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="btn-secondary justify-center">
                  <PhoneIcon className="h-4 w-4" aria-hidden="true" /> {agent.phone}
                </a>
              )}
            </div>
          </aside>

          <section className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900">Listings by {agent.firstName}</h2>
            {listings.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={HomeModernIcon} title="No public listings right now" description="New listings will appear here." />
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {listings.map((l) => (
                  <li key={l._id}>
                    <Link to={`/properties/${l._id}`} className="card-plain group block overflow-hidden">
                      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                        <img src={propertyImage(l.photos)} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate font-semibold text-gray-900">{l.title}</h3>
                          <StatusBadge status={l.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{[l.address?.city, l.address?.country].filter(Boolean).join(', ')}</p>
                        <p className="mt-2 font-bold text-gray-900">
                          {money(l.price, l.currency)}
                          {l.listingType === 'rental' && <span className="text-sm font-normal text-gray-500"> / month</span>}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AgentProfilePage;
