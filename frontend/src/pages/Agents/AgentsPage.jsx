import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { EmptyState, Spinner } from '../../components/ui';
import { agentAPI } from '../../services/agentAPI';
import { assetUrl } from '../../config';
import useDebouncedValue from '../../hooks/useDebouncedValue';

export const AgentAvatar = ({ agent, size = 'h-14 w-14 text-lg' }) => {
  const src = assetUrl(agent?.profilePicture || agent?.avatar);
  return src ? (
    <img src={src} alt="" className={`${size} flex-shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex flex-shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700`}>
      {(agent?.firstName?.[0] || '') + (agent?.lastName?.[0] || '')}
    </span>
  );
};

const AgentsPage = () => {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const [agents, setAgents] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    agentAPI
      .listAgents(debounced ? { q: debounced } : {})
      .then((res) => !cancelled && (setAgents(res.data.agents || []), setFailed(false)))
      .catch(() => !cancelled && (setAgents([]), setFailed(true)));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="text-sm font-semibold text-brand-700">Our agents</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Find an agent you can trust</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Verified local agents who know the market. Browse their listings and message them directly.
          </p>
          <div className="relative mt-6 max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              className="input pl-10"
              placeholder="Search by name, agency or city"
              aria-label="Search agents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!agents ? (
          <Spinner label="Loading agents" />
        ) : agents.length === 0 ? (
          <EmptyState
            icon={UserGroupIcon}
            title={failed ? 'Could not load agents' : debounced ? 'No agents match your search' : 'No agents yet'}
            description={failed ? 'Please try again in a moment.' : 'Check back soon.'}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <li key={a._id}>
                <Link to={`/agents/${a._id}`} className="card-plain flex h-full flex-col p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <AgentAvatar agent={a} />
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-gray-900">{a.firstName} {a.lastName}</h2>
                      <p className="truncate text-sm text-gray-500">{a.agent?.agency || a.company || 'Independent agent'}</p>
                      {a.location?.city && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" /> {a.location.city}
                        </p>
                      )}
                    </div>
                  </div>
                  {a.agent?.specializations?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {a.agent.specializations.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>
                      ))}
                    </div>
                  )}
                  <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
                    <div>
                      <dt className="text-xs text-gray-500">Active</dt>
                      <dd className="font-semibold text-gray-900">{a.activeListings}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Closed</dt>
                      <dd className="font-semibold text-gray-900">{a.closedDeals}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Experience</dt>
                      <dd className="font-semibold text-gray-900">{a.agent?.experience ? `${a.agent.experience} yr` : '—'}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;
