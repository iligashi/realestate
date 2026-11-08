import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MegaphoneIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EmptyState, PageHeader, Spinner } from '../../../components/ui';
import { adminAPI } from '../../../services/adminAPI';
import { Field, FilterSelect, Modal, StatusBadge, docId } from '../shared';

const TYPES = [['general', 'General'], ['update', 'Product update'], ['promotion', 'Promotion'], ['maintenance', 'Maintenance'], ['alert', 'Alert']];
const PRIORITIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']];
const AUDIENCES = [['all', 'Everyone'], ['buyers', 'Buyers'], ['sellers', 'Sellers'], ['renters', 'Renters'], ['agents', 'Agents']];
const STATES = [['', 'All'], ['live', 'Live'], ['scheduled', 'Scheduled'], ['draft', 'Draft'], ['expired', 'Expired']];

// <input type="datetime-local"> works in local time without a zone suffix
const toLocalInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const formatWhen = (date) =>
  date ? new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

const EMPTY = {
  title: '',
  content: '',
  type: 'general',
  priority: 'medium',
  targetAudience: ['all'],
  isActive: true,
  isPinned: false,
  startDate: '',
  endDate: ''
};

const AnnouncementForm = ({ initial, onClose, onSaved }) => {
  const editing = Boolean(initial);
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...EMPTY,
          ...initial,
          targetAudience: initial.targetAudience?.length ? initial.targetAudience : ['all'],
          startDate: toLocalInput(initial.startDate),
          endDate: toLocalInput(initial.endDate)
        }
      : EMPTY
  );
  const [schedule, setSchedule] = useState(() => Boolean(initial && (new Date(initial.startDate) > new Date() || initial.endDate)));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleAudience = (value) => {
    let next;
    if (value === 'all') next = ['all'];
    else {
      const current = form.targetAudience.filter((a) => a !== 'all');
      next = current.includes(value) ? current.filter((a) => a !== value) : [...current, value];
      if (next.length === 0) next = ['all'];
    }
    set('targetAudience', next);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Add a title';
    if (!form.content.trim()) errs.content = 'Add the message';
    if (schedule && form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      errs.endDate = 'End must be after the start';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      title: form.title,
      content: form.content,
      type: form.type,
      priority: form.priority,
      targetAudience: form.targetAudience,
      isActive: form.isActive,
      isPinned: form.isPinned,
      startDate: schedule && form.startDate ? new Date(form.startDate).toISOString() : editing && !schedule ? new Date().toISOString() : null,
      endDate: schedule && form.endDate ? new Date(form.endDate).toISOString() : null
    };
    if (editing && !schedule && initial.startDate && new Date(initial.startDate) <= new Date()) payload.startDate = initial.startDate;

    setSaving(true);
    try {
      if (editing) await adminAPI.updateAnnouncement(docId(initial), payload);
      else await adminAPI.createAnnouncement(payload);
      toast.success(editing ? 'Announcement updated' : 'Announcement created');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save the announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={editing ? 'Edit announcement' : 'New announcement'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="announcement-form" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : form.isActive ? (schedule && form.startDate && new Date(form.startDate) > new Date() ? 'Schedule' : 'Publish') : 'Save draft'}
          </button>
        </>
      }
    >
      <form id="announcement-form" onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="ann-title" className="label">Title</label>
          <input id="ann-title" className="input" maxLength={200} value={form.title} onChange={(e) => set('title', e.target.value)} aria-invalid={Boolean(errors.title)} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="ann-content" className="label">Message</label>
          <textarea id="ann-content" rows={4} className="input" maxLength={2000} value={form.content} onChange={(e) => set('content', e.target.value)} aria-invalid={Boolean(errors.content)} />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-red-600">{errors.content}</span>
            <span className="text-gray-400">{form.content.length}/2000</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Who sees it">
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(([v, t]) => {
              const on = form.targetAudience.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAudience(v)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-medium text-gray-900">Schedule</span>
              <span className="block text-gray-500">Choose when it starts showing and when it ends.</span>
            </span>
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
          </label>
          {schedule && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ann-start" className="label">Starts</label>
                <input id="ann-start" type="datetime-local" className="input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                <p className="mt-1 text-xs text-gray-400">Leave empty to start now</p>
              </div>
              <div>
                <label htmlFor="ann-end" className="label">Ends</label>
                <input id="ann-end" type="datetime-local" className="input" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set('endDate', e.target.value)} aria-invalid={Boolean(errors.endDate)} />
                {errors.endDate ? <p className="mt-1 text-xs text-red-600">{errors.endDate}</p> : <p className="mt-1 text-xs text-gray-400">Leave empty to keep it running</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active (uncheck to keep as a draft)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={form.isPinned} onChange={(e) => set('isPinned', e.target.checked)} />
            Pin to the top
          </label>
        </div>
      </form>
    </Modal>
  );
};

const AnnouncementsSection = () => {
  const [items, setItems] = useState(null);
  const [state, setState] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, object = edit

  const load = useCallback(async () => {
    try {
      const res = await adminAPI.getAnnouncements({ state, limit: 100 });
      setItems(res.data.announcements || []);
    } catch {
      setItems([]);
      toast.error('Could not load announcements');
    }
  }, [state]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (a) => {
    if (!window.confirm(`Delete “${a.title}”? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteAnnouncement(docId(a));
      toast.success('Announcement deleted');
      load();
    } catch {
      toast.error('Could not delete the announcement');
    }
  };

  const toggleActive = async (a) => {
    try {
      await adminAPI.updateAnnouncement(docId(a), { isActive: !a.isActive });
      toast.success(a.isActive ? 'Moved to drafts' : 'Announcement activated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update');
    }
  };

  const audienceText = (list = []) =>
    list.includes('all') || !list.length ? 'Everyone' : list.map((v) => AUDIENCES.find(([k]) => k === v)?.[1] || v).join(', ');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Banners shown on the home page. Schedule them ahead and target them by role."
        actions={
          <>
            <FilterSelect label="State" value={state} onChange={setState} options={STATES} />
            <button type="button" className="btn-primary" onClick={() => setEditing({})}>
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              New announcement
            </button>
          </>
        }
      />

      {!items ? (
        <Spinner label="Loading announcements" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title={state ? 'Nothing here' : 'No announcements yet'}
          description={state ? 'No announcements in this state.' : 'Create one to show news, updates or promotions to your users.'}
          action={!state && <button type="button" className="btn-primary" onClick={() => setEditing({})}>New announcement</button>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={docId(a)} className="card-plain p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={a.state} />
                    {a.isPinned && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Pinned</span>}
                    <span className="text-xs capitalize text-gray-500">{a.type} · {a.priority} priority</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.content}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {audienceText(a.targetAudience)}
                    {' · '}
                    {a.state === 'scheduled' ? `Starts ${formatWhen(a.startDate)}` : `Started ${formatWhen(a.startDate) || '—'}`}
                    {a.endDate ? ` · ${a.state === 'expired' ? 'Ended' : 'Ends'} ${formatWhen(a.endDate)}` : ''}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button type="button" className="btn-ghost text-sm" onClick={() => toggleActive(a)}>
                    {a.isActive ? 'Unpublish' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => setEditing(a)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-700" aria-label={`Edit ${a.title}`}>
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(a)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${a.title}`}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <AnnouncementForm
          initial={docId(editing) ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default AnnouncementsSection;
