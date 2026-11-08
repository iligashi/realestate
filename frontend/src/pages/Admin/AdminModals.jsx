import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/adminAPI';
import { Field, Modal, docId } from './shared';

export const EditUserModal = ({ user, onClose, onSave, saving }) => {
  const [userType, setUserType] = useState(user.userType);
  const [isBlocked, setIsBlocked] = useState(Boolean(user.isBlocked));

  return (
    <Modal
      title="Edit user"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={saving} onClick={() => onSave({ userType, isBlocked })}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="rounded-xl bg-gray-50 p-3 text-sm">
        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
        <p className="text-gray-500">{user.email}</p>
      </div>
      <Field label="Role">
        <select className="input" value={userType} onChange={(e) => setUserType(e.target.value)}>
          {['buyer', 'seller', 'renter', 'agent', 'admin'].map((r) => (
            <option key={r} value={r} className="capitalize">{r[0].toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </Field>
      <Field label="Account status">
        <select className="input" value={isBlocked ? 'blocked' : 'active'} onChange={(e) => setIsBlocked(e.target.value === 'blocked')}>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </Field>
    </Modal>
  );
};

export const EditListingModal = ({ listing, onClose, onSave, saving }) => {
  const [status, setStatus] = useState(listing.status);

  return (
    <Modal
      title="Change listing status"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={saving || status === listing.status} onClick={() => onSave({ status })}>
            {saving ? 'Saving…' : 'Update status'}
          </button>
        </>
      }
    >
      <p className="rounded-xl bg-gray-50 p-3 text-sm font-medium text-gray-900">{listing.title}</p>
      <Field label="Status">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending review (hidden)</option>
          <option value="active">Active (public)</option>
          <option value="under-contract">Under contract</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="inactive">Inactive (hidden)</option>
        </select>
      </Field>
    </Modal>
  );
};

export const ReviewReportModal = ({ report, onClose, onSave, saving }) => {
  const [action, setAction] = useState('no_action');
  const [adminNotes, setAdminNotes] = useState('');

  const submit = (status) => onSave({ status, action: status === 'resolved' ? action : 'no_action', adminNotes: adminNotes.trim() || undefined });

  return (
    <Modal
      title="Review report"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" disabled={saving} onClick={() => submit('dismissed')}>Dismiss</button>
          <button type="button" className="btn-primary" disabled={saving} onClick={() => submit('resolved')}>
            {saving ? 'Saving…' : 'Resolve'}
          </button>
        </>
      }
    >
      <div className="rounded-xl bg-gray-50 p-3 text-sm">
        <p className="font-medium capitalize text-gray-900">{report.type}</p>
        <p className="mt-1 text-gray-700">{report.reason}</p>
      </div>
      <Field label="Action taken">
        <select className="input" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="no_action">No action needed</option>
          <option value="warning">Warning sent</option>
          <option value="content_removal">Content removed</option>
          <option value="suspension">Account suspended</option>
          <option value="ban">Account banned</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Notes (optional)">
        <textarea className="input" rows={3} maxLength={1000} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="What did you check or decide?" />
      </Field>
    </Modal>
  );
};

// Pick which agent represents a listing (or remove the current one)
export const AssignAgentModal = ({ listing, onClose, onAssigned }) => {
  const currentId = listing.agent?._id || listing.agent || '';
  const [agents, setAgents] = useState(null);
  const [agentId, setAgentId] = useState(String(currentId));
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI
      .getAgents()
      .then((res) => setAgents(res.data.agents || []))
      .catch(() => {
        setAgents([]);
        toast.error('Could not load agents');
      });
  }, []);

  const q = query.trim().toLowerCase();
  const shown = (agents || []).filter((a) =>
    !q || `${a.firstName} ${a.lastName} ${a.email} ${a.agent?.agency || ''}`.toLowerCase().includes(q)
  );

  const save = async (id) => {
    setSaving(true);
    try {
      const res = await adminAPI.assignAgent(docId(listing), id || null);
      toast.success(res.data.message);
      onAssigned(res.data.listing);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not assign agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Assign agent"
      onClose={onClose}
      footer={
        <>
          {currentId && (
            <button type="button" className="btn-ghost mr-auto text-red-600" disabled={saving} onClick={() => save(null)}>
              Remove agent
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={saving || !agentId || agentId === String(currentId)} onClick={() => save(agentId)}>
            {saving ? 'Saving…' : 'Assign'}
          </button>
        </>
      }
    >
      <p className="rounded-xl bg-gray-50 p-3 text-sm font-medium text-gray-900">{listing.title}</p>
      <p className="text-sm text-gray-500">
        The agent can edit this listing, update its sale status, and receives buyer inquiries for it. The owner keeps full control.
      </p>
      <input type="search" className="input" placeholder="Search agents" aria-label="Search agents" value={query} onChange={(e) => setQuery(e.target.value)} />
      {!agents ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading agents…</p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          {agents.length === 0 ? 'No agent accounts yet. Change a user’s role to Agent in Users first.' : 'No agents match your search.'}
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto" role="radiogroup" aria-label="Agents">
          {shown.map((a) => {
            const id = String(a._id);
            const selected = id === agentId;
            return (
              <li key={id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAgentId(id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                    {(a.firstName?.[0] || '') + (a.lastName?.[0] || '')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900">
                      {a.firstName} {a.lastName}
                      {id === String(currentId) && <span className="ml-2 text-xs font-normal text-brand-700">Current</span>}
                    </span>
                    <span className="block truncate text-gray-500">{a.agent?.agency || a.email}</span>
                  </span>
                  <span className="text-xs text-gray-400">{a.listingCount} listing{a.listingCount === 1 ? '' : 's'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};
