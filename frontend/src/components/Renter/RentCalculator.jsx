import { useState } from 'react';

const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n || 0)));

// What a rental really costs: monthly total, move-in cash and the whole lease,
// plus a check against the common "rent under 30% of income" rule.
const RentCalculator = () => {
  const [v, setV] = useState({ rent: 650, utilities: 80, other: 20, deposit: 650, fee: 0, months: 12, income: 2000 });
  const num = (k) => Number(v[k]) || 0;
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const monthly = num('rent') + num('utilities') + num('other');
  const moveIn = num('rent') + num('deposit') + num('fee');
  const lease = monthly * num('months') + num('fee');
  const share = num('income') > 0 ? (monthly / num('income')) * 100 : null;
  const tone = share == null ? 'gray' : share <= 30 ? 'emerald' : share <= 40 ? 'amber' : 'red';
  const toneClass = { gray: 'bg-gray-50 text-gray-700', emerald: 'bg-emerald-50 text-emerald-800', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-800' }[tone];

  const field = (k, label, hint) => (
    <div>
      <label htmlFor={`rc-${k}`} className="label">{label}</label>
      <input id={`rc-${k}`} type="number" min={0} inputMode="decimal" className="input" value={v[k]} onChange={set(k)} />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-900">Rent calculator</h2>
      <p className="text-sm text-gray-500">See the monthly cost, what you need to move in, and if it fits your budget.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('rent', 'Monthly rent')}
          {field('utilities', 'Utilities per month', 'Power, water, heating, internet')}
          {field('other', 'Other monthly costs', 'Building fee, parking')}
          {field('deposit', 'Security deposit')}
          {field('fee', 'One-time fees', 'Agency or admin fee')}
          {field('months', 'Lease length (months)')}
          <div className="sm:col-span-2">{field('income', 'Your monthly income (after tax)')}</div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Per month</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{fmt(monthly)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">To move in</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{fmt(moveIn)}</p>
              <p className="text-xs text-gray-400">First month + deposit + fees</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Whole lease</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{fmt(lease)}</p>
              <p className="text-xs text-gray-400">Deposit comes back at the end</p>
            </div>
          </div>
          <div className={`rounded-xl p-4 ${toneClass}`} role="status">
            {share == null ? (
              <p className="text-sm">Add your income to check affordability.</p>
            ) : (
              <>
                <p className="text-sm font-semibold">Housing takes {share.toFixed(0)}% of your income</p>
                <p className="mt-1 text-sm">
                  {share <= 30
                    ? 'Comfortable. A common guideline is to keep housing under 30%.'
                    : share <= 40
                      ? 'Tight. Above the usual 30% guideline, so leave room in your budget.'
                      : 'Risky. Well above the 30% guideline.'}
                </p>
                <p className="mt-2 text-xs opacity-80">At 30% of your income, you could afford about {fmt(num('income') * 0.3)} per month in total.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentCalculator;
