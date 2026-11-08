import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { propertyImage } from '../../config';

const isRental = (p) => p.listingType === 'rental' || p.listingType === 'rent';

// Start a conversation about one of your saved properties. Messages go to the
// listing's agent when one is assigned, otherwise to the owner.
const NewConversationModal = ({ kind = 'sale', onClose, onSent }) => {
  const [saved, setSaved] = useState(null);
  const [propertyId, setPropertyId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get('/favorites')
      .then((res) => {
        const list = (res.data.properties || []).filter((p) => (kind === 'rental' ? isRental(p) : !isRental(p)));
        setSaved(list);
        if (list[0]) setPropertyId(list[0]._id);
      })
      .catch(() => setSaved([]));
  }, [kind]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async (e) => {
    e.preventDefault();
    if (!propertyId || !subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await api.post(kind === 'rental' ? '/messages/rental' : '/messages', { propertyId, subject: subject.trim(), message: message.trim() });
      toast.success('Message sent');
      onSent?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send the message');
    } finally {
      setSending(false);
    }
  };

  const listPath = kind === 'rental' ? '/rentals' : '/properties';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-4 sm:items-center" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="New message" className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">New message</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {!saved ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">Loading your saved properties…</p>
        ) : saved.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-600">
              Messages are about a specific property. Save a {kind === 'rental' ? 'rental' : 'property'} to your wishlist, or open one and use its contact button.
            </p>
            <Link to={listPath} className="btn-primary mt-4 inline-flex" onClick={onClose}>
              Browse {kind === 'rental' ? 'rentals' : 'properties'}
            </Link>
          </div>
        ) : (
          <form onSubmit={send} className="flex min-h-0 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <fieldset>
                <legend className="label">About which property?</legend>
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {saved.map((p) => (
                    <li key={p._id}>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2 text-sm ${propertyId === p._id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="property" className="sr-only" checked={propertyId === p._id} onChange={() => setPropertyId(p._id)} />
                        <img src={propertyImage(p.photos)} alt="" className="h-10 w-14 flex-shrink-0 rounded-lg object-cover" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray-900">{p.title}</span>
                          <span className="block truncate text-gray-500">{p.address?.city}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              <div>
                <label htmlFor="nc-subject" className="label">Subject</label>
                <input id="nc-subject" className="input" maxLength={200} required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={kind === 'rental' ? 'Is it still available?' : 'Question about the property'} />
              </div>
              <div>
                <label htmlFor="nc-message" className="label">Message</label>
                <textarea id="nc-message" rows={4} className="input" maxLength={2000} required value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={sending || !propertyId || !subject.trim() || !message.trim()}>
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewConversationModal;
