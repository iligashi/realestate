import { useState } from 'react';
import { Field, Modal } from './shared';

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
