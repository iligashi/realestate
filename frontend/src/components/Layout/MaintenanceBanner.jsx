import { useEffect, useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/agentAPI';

// Shows a notice while an admin has the platform in maintenance mode.
const MaintenanceBanner = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      publicAPI
        .getSettings()
        .then((res) => !cancelled && setInfo(res.data.settings?.maintenance || null))
        .catch(() => {});
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!info?.active) return null;
  const until = info.endsAt
    ? new Date(info.endsAt).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-amber-50 text-amber-900" role="status">
      <div className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2.5 text-sm sm:items-center sm:px-6 lg:px-8">
        <WrenchScrewdriverIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Maintenance in progress.</span>{' '}
          {info.message || 'You can browse, but changes are paused for a short while.'}
          {until && <span className="text-amber-700"> Expected back {until}.</span>}
        </p>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
