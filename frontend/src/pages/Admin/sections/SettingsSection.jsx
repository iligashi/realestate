import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Spinner } from '../../../components/ui';
import { adminAPI } from '../../../services/adminAPI';

const TABS = [
  ['general', 'General'],
  ['listings', 'Listings & business'],
  ['features', 'Features'],
  ['maintenance', 'Maintenance']
];

const toLocalInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Text = ({ id, label, value, onChange, type = 'text', hint, ...rest }) => (
  <div>
    <label htmlFor={id} className="label">{label}</label>
    <input id={id} type={type} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <label className="flex items-start justify-between gap-4 py-3">
    <span className="text-sm">
      <span className="font-medium text-gray-900">{label}</span>
      {description && <span className="block text-gray-500">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </label>
);

const SettingsSection = () => {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI
      .getPlatformSettings()
      .then((res) => {
        const s = res.data.settings || res.data;
        setSettings({
          ...s,
          maintenance: {
            ...s.maintenance,
            maintenanceStartTime: toLocalInput(s.maintenance?.maintenanceStartTime),
            maintenanceEndTime: toLocalInput(s.maintenance?.maintenanceEndTime)
          }
        });
      })
      .catch(() => toast.error('Could not load settings'));
  }, []);

  if (!settings) return <Spinner label="Loading settings" />;

  const set = (section, key, value) => setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));
  const setNested = (section, key, sub, value) =>
    setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: { ...(s[section]?.[key] || {}), [sub]: value } } }));
  const g = settings.general || {};
  const b = settings.business || {};
  const f = settings.features || {};
  const m = settings.maintenance || {};

  const save = async () => {
    const payload = {};
    if (tab === 'general') payload.general = g;
    if (tab === 'listings') {
      payload.business = { commissionRate: Number(b.commissionRate), featuredListingPrice: Number(b.featuredListingPrice), currency: b.currency, taxRate: Number(b.taxRate) };
      payload.features = {
        requireListingApproval: f.requireListingApproval !== false,
        allowRenterListings: f.allowRenterListings !== false,
        maxListingsPerUser: Number(f.maxListingsPerUser),
        maxImagesPerListing: Number(f.maxImagesPerListing)
      };
    }
    if (tab === 'features') {
      payload.features = {
        enableMessaging: f.enableMessaging,
        enableReviews: f.enableReviews,
        enableNotifications: f.enableNotifications,
        enableAdvancedSearch: f.enableAdvancedSearch,
        enableVirtualTours: f.enableVirtualTours
      };
    }
    if (tab === 'maintenance') {
      if (m.maintenanceStartTime && m.maintenanceEndTime && new Date(m.maintenanceEndTime) <= new Date(m.maintenanceStartTime)) {
        toast.error('The end time must be after the start time');
        return;
      }
      payload.maintenance = {
        isMaintenanceMode: Boolean(m.isMaintenanceMode),
        maintenanceMessage: m.maintenanceMessage || '',
        maintenanceStartTime: m.maintenanceStartTime ? new Date(m.maintenanceStartTime).toISOString() : '',
        maintenanceEndTime: m.maintenanceEndTime ? new Date(m.maintenanceEndTime).toISOString() : ''
      };
    }
    setSaving(true);
    try {
      await adminAPI.updatePlatformSettings(payload);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform-wide options. Changes apply right away." />

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200" role="tablist">
        {TABS.map(([id, name]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="card-plain p-5 sm:p-6">
        {tab === 'general' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Text id="s-name" label="Site name" value={g.siteName} onChange={(v) => set('general', 'siteName', v)} maxLength={100} />
            <Text id="s-email" type="email" label="Contact email" value={g.contactEmail} onChange={(v) => set('general', 'contactEmail', v)} />
            <div className="sm:col-span-2">
              <label htmlFor="s-desc" className="label">Description</label>
              <textarea id="s-desc" rows={2} className="input" maxLength={500} value={g.siteDescription || ''} onChange={(e) => set('general', 'siteDescription', e.target.value)} />
            </div>
            <Text id="s-phone" label="Contact phone" value={g.contactPhone} onChange={(v) => set('general', 'contactPhone', v)} />
            <Text id="s-city" label="City" value={g.address?.city} onChange={(v) => setNested('general', 'address', 'city', v)} />
            <Text id="s-street" label="Street address" value={g.address?.street} onChange={(v) => setNested('general', 'address', 'street', v)} />
            <Text id="s-country" label="Country" value={g.address?.country} onChange={(v) => setNested('general', 'address', 'country', v)} />
            {['facebook', 'instagram', 'linkedin', 'twitter'].map((n) => (
              <Text key={n} id={`s-${n}`} type="url" label={`${n[0].toUpperCase()}${n.slice(1)} URL`} value={g.socialMedia?.[n]} onChange={(v) => setNested('general', 'socialMedia', n, v)} placeholder="https://" />
            ))}
          </div>
        )}

        {tab === 'listings' && (
          <div className="space-y-6">
            <div className="divide-y divide-gray-100">
              <Toggle
                label="Review new listings before they go live"
                description="When off, listings from sellers, renters and agents are published immediately."
                checked={f.requireListingApproval !== false}
                onChange={(v) => set('features', 'requireListingApproval', v)}
              />
              <Toggle
                label="Let renters post rental listings"
                description="Renters can list a room or a sublet. They can never post a sale."
                checked={f.allowRenterListings !== false}
                onChange={(v) => set('features', 'allowRenterListings', v)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Text id="s-maxlist" type="number" min={1} max={100} label="Max listings per user" value={f.maxListingsPerUser} onChange={(v) => set('features', 'maxListingsPerUser', v)} hint="Inactive listings do not count. Admins have no limit." />
              <Text id="s-maximg" type="number" min={1} max={100} label="Max photos per listing" value={f.maxImagesPerListing} onChange={(v) => set('features', 'maxImagesPerListing', v)} />
              <Text id="s-comm" type="number" min={0} max={100} step="0.1" label="Agent commission (%)" value={b.commissionRate} onChange={(v) => set('business', 'commissionRate', v)} />
              <Text id="s-feat" type="number" min={0} step="0.01" label="Featured listing price" value={b.featuredListingPrice} onChange={(v) => set('business', 'featuredListingPrice', v)} />
              <div>
                <label htmlFor="s-cur" className="label">Default currency</label>
                <select id="s-cur" className="input" value={b.currency || 'USD'} onChange={(e) => set('business', 'currency', e.target.value)}>
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Text id="s-tax" type="number" min={0} max={100} step="0.1" label="Tax rate (%)" value={b.taxRate} onChange={(v) => set('business', 'taxRate', v)} />
            </div>
          </div>
        )}

        {tab === 'features' && (
          <div className="divide-y divide-gray-100">
            <Toggle label="Messaging" description="Buyers and renters can start new conversations with owners and agents." checked={f.enableMessaging !== false} onChange={(v) => set('features', 'enableMessaging', v)} />
            <Toggle label="Reviews" description="Users can leave reviews." checked={f.enableReviews !== false} onChange={(v) => set('features', 'enableReviews', v)} />
            <Toggle label="Notifications" description="In-app notifications for messages and bookings." checked={f.enableNotifications !== false} onChange={(v) => set('features', 'enableNotifications', v)} />
            <Toggle label="Advanced search" description="Extra filters on the properties page." checked={f.enableAdvancedSearch !== false} onChange={(v) => set('features', 'enableAdvancedSearch', v)} />
            <Toggle label="Virtual tours" description="Show virtual tour links on listings." checked={Boolean(f.enableVirtualTours)} onChange={(v) => set('features', 'enableVirtualTours', v)} />
          </div>
        )}

        {tab === 'maintenance' && (
          <div className="space-y-4">
            <Toggle
              label="Maintenance mode"
              description="Visitors can still browse, but only admins can make changes. A banner explains why."
              checked={Boolean(m.isMaintenanceMode)}
              onChange={(v) => set('maintenance', 'isMaintenanceMode', v)}
            />
            <div>
              <label htmlFor="s-mmsg" className="label">Message shown to users</label>
              <textarea id="s-mmsg" rows={2} className="input" maxLength={1000} value={m.maintenanceMessage || ''} onChange={(e) => set('maintenance', 'maintenanceMessage', e.target.value)} placeholder="We are upgrading the platform and will be back shortly." />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Text id="s-mstart" type="datetime-local" label="Starts (optional)" value={m.maintenanceStartTime} onChange={(v) => set('maintenance', 'maintenanceStartTime', v)} hint="Empty means as soon as it is switched on" />
              <Text id="s-mend" type="datetime-local" label="Ends (optional)" value={m.maintenanceEndTime} onChange={(v) => set('maintenance', 'maintenanceEndTime', v)} hint="Maintenance stops automatically after this time" />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
          <button type="button" className="btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
