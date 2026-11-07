import { useCallback, useEffect, useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import api from '../../../services/api';
import { EmptyState, PageHeader, Spinner } from '../../../components/ui';
import { formatDate } from '../shared';

// Messages sent through the public Contact page
const MessagesSection = () => {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/contact');
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load messages.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Contact messages" description="Messages sent from the Contact page. Reply by email." />
      {error ? (
        <EmptyState icon={EnvelopeIcon} title="Messages unavailable" description={error} action={<button type="button" className="btn-primary" onClick={load}>Try again</button>} />
      ) : !messages ? (
        <Spinner label="Loading messages" />
      ) : messages.length === 0 ? (
        <EmptyState icon={EnvelopeIcon} title="No messages yet" description="When someone uses the Contact page, their message appears here." />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m._id} className="card-plain p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900">
                  {m.name} <span className="font-normal text-gray-500">· {m.email}</span>
                </p>
                <span className="text-xs text-gray-500">{formatDate(m.createdAt)}</span>
              </div>
              <span className="badge mt-2 capitalize">{m.subject}</span>
              <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{m.message}</p>
              <a href={`mailto:${m.email}?subject=Re: your message to RealEstate`} className="btn-secondary mt-4">
                Reply by email
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MessagesSection;
