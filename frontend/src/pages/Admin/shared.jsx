import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useDebouncedValue from '../../hooks/useDebouncedValue';

// Mongo documents come back with `_id`; some older code expected `id`.
export const docId = (doc) => doc?._id || doc?.id;

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  under_review: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'under-contract': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  sold: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  rented: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  blocked: 'bg-red-50 text-red-700 ring-red-600/20',
  dismissed: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  inactive: 'bg-gray-50 text-gray-600 ring-gray-500/20'
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
      STATUS_STYLES[status] || STATUS_STYLES.inactive
    }`}
  >
    {String(status || 'unknown').replace(/[_-]/g, ' ')}
  </span>
);

// Search box that keeps its own text and only reports changes after typing pauses,
// so the list isn't refetched (and the input doesn't lose focus) on every keystroke.
export const SearchInput = ({ value = '', onSearch, placeholder = 'Search…', label = 'Search' }) => {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, 350);

  useEffect(() => {
    if (debounced !== value) onSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <div className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className="input w-full pl-9 sm:w-64"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
};

export const FilterSelect = ({ label, value, onChange, options }) => (
  <select aria-label={label} className="input w-auto" value={value || ''} onChange={(e) => onChange(e.target.value)}>
    {options.map(([v, text]) => (
      <option key={v} value={v}>
        {text}
      </option>
    ))}
  </select>
);

export const Modal = ({ title, onClose, children, footer }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export const Field = ({ label, children }) => (
  <div>
    <p className="label">{label}</p>
    {children}
  </div>
);
