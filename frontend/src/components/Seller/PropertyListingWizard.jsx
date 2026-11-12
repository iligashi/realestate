import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { createProperty } from '../../store/slices/propertySlice';
import {
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const TITLE_MIN = 10;
const DESCRIPTION_MIN = 50;
const MAX_PHOTOS = 10;
const MAX_PHOTO_MB = 10;
const CURRENT_YEAR = new Date().getFullYear();

const AMENITIES = [
  'Swimming Pool', 'Gym', 'Parking', 'Balcony', 'Garden', 'Air Conditioning',
  'Heating', 'Dishwasher', 'Washing Machine', 'Dryer', 'Internet', 'Cable TV',
  'Security System', 'Elevator', 'Concierge'
];

const FEATURES = [
  { key: 'parkingAvailable', label: 'Parking available' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'petFriendly', label: 'Pet friendly' }
];

const STEPS = ['Basics', 'Location', 'Details', 'Price', 'Photos', 'Review'];

const todayISO = () => new Date().toISOString().slice(0, 10);
const addMonthsISO = (iso, months) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const initialData = (mode) => ({
  title: '',
  description: '',
  propertyType: 'apartment',
  listingType: mode === 'rental' ? 'rental' : 'sale',
  price: '',
  currency: 'EUR',
  address: { street: '', city: '', state: '', zipCode: '', country: '' },
  details: { bedrooms: '', bathrooms: '', squareMeters: '', yearBuilt: '', parkingSpaces: '' },
  features: { parkingAvailable: false, furnished: false, petFriendly: false },
  amenities: [],
  rentalDetails: {
    availableFrom: todayISO(),
    availableUntil: addMonthsISO(todayISO(), 12),
    minimumLeaseMonths: '6',
    depositRequired: '',
    utilitiesIncluded: false
  }
});

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

/** Same rules the API enforces, so problems show up before submitting. */
const validateStep = (step, data, photos, isRental) => {
  const e = {};
  if (step === 1) {
    if (data.title.trim().length < TITLE_MIN) e.title = `Use at least ${TITLE_MIN} characters.`;
    if (data.description.trim().length < DESCRIPTION_MIN) e.description = `Use at least ${DESCRIPTION_MIN} characters.`;
  }
  if (step === 2) {
    if (isBlank(data.address.city)) e.city = 'City is required.';
    if (isBlank(data.address.country)) e.country = 'Country is required.';
  }
  if (step === 3) {
    const { bedrooms, bathrooms, squareMeters, yearBuilt } = data.details;
    if (isBlank(bedrooms) || Number(bedrooms) < 0) e.bedrooms = 'Enter 0 or more.';
    if (isBlank(bathrooms) || Number(bathrooms) < 0) e.bathrooms = 'Enter 0 or more.';
    if (!isBlank(squareMeters) && Number(squareMeters) <= 0) e.squareMeters = 'Must be greater than 0.';
    if (!isBlank(yearBuilt) && (Number(yearBuilt) < 1800 || Number(yearBuilt) > CURRENT_YEAR + 5)) {
      e.yearBuilt = `Between 1800 and ${CURRENT_YEAR + 5}.`;
    }
  }
  if (step === 4) {
    if (isBlank(data.price) || Number(data.price) <= 0) e.price = 'Enter an amount greater than 0.';
    if (isRental) {
      const r = data.rentalDetails;
      if (!r.availableFrom) e.availableFrom = 'Pick a start date.';
      if (!r.availableUntil) e.availableUntil = 'Pick an end date.';
      if (r.availableFrom && r.availableUntil && r.availableUntil <= r.availableFrom) {
        e.availableUntil = 'Must be after the start date.';
      }
      if (isBlank(r.minimumLeaseMonths) || Number(r.minimumLeaseMonths) < 1) e.minimumLeaseMonths = 'At least 1 month.';
      if (!isBlank(r.depositRequired) && Number(r.depositRequired) < 0) e.depositRequired = 'Cannot be negative.';
    }
  }
  if (step === 5 && photos.length === 0) e.photos = 'Add at least one photo.';
  return e;
};

const Field = ({ label, required, error, hint, children, htmlFor }) => (
  <div>
    <label htmlFor={htmlFor} className="label">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    {children}
    {error ? (
      <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    ) : null}
  </div>
);

const inputCls = (error) =>
  `input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`;

/**
 * Step-by-step form for creating a listing.
 * mode="sale"   → sellers and agents (sale, rent or auction)
 * mode="rental" → renters (monthly rent and lease terms)
 */
const PropertyListingWizard = ({ onClose, onCreated, mode = 'sale' }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.property);
  const isRental = mode === 'rental';

  const [step, setStep] = useState(1);
  const [data, setData] = useState(() => initialData(mode));
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Lock page scroll behind the dialog, close on Escape, free previews on unmount.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const set = (path, value) => {
    const [parent, child] = path.split('.');
    setData((prev) => (child ? { ...prev, [parent]: { ...prev[parent], [child]: value } } : { ...prev, [parent]: value }));
    const key = child || parent;
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const room = MAX_PHOTOS - photos.length;
    const accepted = [];
    let rejected = 0;
    files.forEach((file) => {
      if (!file.type.startsWith('image/') || file.size > MAX_PHOTO_MB * 1024 * 1024) rejected += 1;
      else if (accepted.length < room) accepted.push(file);
    });
    if (rejected) toast.error(`Skipped ${rejected} file(s): images up to ${MAX_PHOTO_MB} MB only.`);
    if (files.length - rejected > room) toast.error(`You can add up to ${MAX_PHOTOS} photos.`);
    if (!accepted.length) return;
    setPhotos((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file), id: `${file.name}-${file.size}-${Math.random()}` }))
    ]);
    setErrors(({ photos: _removed, ...rest }) => rest);
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const makeCover = (id) => {
    setPhotos((prev) => [...prev.filter((p) => p.id === id), ...prev.filter((p) => p.id !== id)]);
  };

  const toggleAmenity = (amenity) => {
    setData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, data, photos, isRental);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      requestAnimationFrame(() => {
        bodyRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const jumpTo = (target) => {
    if (target < step) {
      setErrors({});
      setStep(target);
    }
  };

  const buildFormData = () => {
    const fd = new FormData();
    const append = (key, value) => {
      if (!isBlank(value)) fd.append(key, value);
    };
    append('title', data.title.trim());
    append('description', data.description.trim());
    append('propertyType', data.propertyType);
    append('listingType', data.listingType);
    append('price', data.price);
    append('currency', data.currency);
    Object.entries(data.address).forEach(([k, v]) => append(`address[${k}]`, typeof v === 'string' ? v.trim() : v));
    fd.append('location[type]', 'Point');
    fd.append('location[coordinates][0]', '0');
    fd.append('location[coordinates][1]', '0');
    Object.entries(data.details).forEach(([k, v]) => append(`details[${k}]`, v));
    Object.entries(data.features).forEach(([k, v]) => fd.append(`features[${k}]`, String(v)));
    data.amenities.forEach((a) => fd.append('amenities', a));
    if (isRental) {
      const r = data.rentalDetails;
      fd.append('rentalDetails[monthlyRent]', data.price);
      append('rentalDetails[availableFrom]', r.availableFrom);
      append('rentalDetails[availableUntil]', r.availableUntil);
      append('rentalDetails[minimumLeaseMonths]', r.minimumLeaseMonths);
      append('rentalDetails[depositRequired]', r.depositRequired);
      fd.append('rentalDetails[utilitiesIncluded]', String(r.utilitiesIncluded));
      fd.append('rentalDetails[furnished]', String(data.features.furnished));
    }
    photos.forEach((p) => fd.append('images', p.file));
    return fd;
  };

  const handleSubmit = async () => {
    // Re-check every step in case something was changed after it was passed.
    for (let s = 1; s < STEPS.length; s += 1) {
      const stepErrors = validateStep(s, data, photos, isRental);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        setStep(s);
        return;
      }
    }
    setSubmitError('');
    try {
      const result = await dispatch(createProperty(buildFormData())).unwrap();
      toast.success('Listing submitted. It will go live once an admin approves it.');
      // The caller decides where to go next; without a handler, just close.
      if (onCreated) onCreated(result?.property);
      else onClose();
    } catch (err) {
      const message = typeof err === 'string' ? err : err?.message || 'Could not create the listing. Please try again.';
      setSubmitError(message);
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const priceLabel = isRental || ['rent', 'rental'].includes(data.listingType) ? 'Monthly rent' : 'Price';
  const formatMoney = (value) => {
    const n = Number(value);
    if (!n) return '-';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: data.currency, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${data.currency} ${n.toLocaleString()}`;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <Field label="Title" required htmlFor="w-title" error={errors.title} hint={`${data.title.trim().length}/${TITLE_MIN} characters minimum`}>
              <input
                id="w-title"
                type="text"
                value={data.title}
                onChange={(e) => set('title', e.target.value)}
                className={inputCls(errors.title)}
                placeholder="e.g. Bright 2-bedroom flat near the city centre"
                maxLength={120}
              />
            </Field>

            <Field
              label="Description"
              required
              htmlFor="w-description"
              error={errors.description}
              hint={`${data.description.trim().length}/${DESCRIPTION_MIN} characters minimum`}
            >
              <textarea
                id="w-description"
                value={data.description}
                onChange={(e) => set('description', e.target.value)}
                rows={5}
                className={`${inputCls(errors.description)} resize-y`}
                placeholder="What makes it special? Layout, light, condition, neighbourhood, transport..."
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Property type" required htmlFor="w-type">
                <select id="w-type" value={data.propertyType} onChange={(e) => set('propertyType', e.target.value)} className="input">
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                </select>
              </Field>

              {isRental ? (
                <Field label="Listing type" htmlFor="w-listing">
                  <div id="w-listing" className="input bg-gray-50 text-gray-600">Long-term rental</div>
                </Field>
              ) : (
                <Field label="Listing type" required htmlFor="w-listing">
                  <select id="w-listing" value={data.listingType} onChange={(e) => set('listingType', e.target.value)} className="input">
                    <option value="sale">For sale</option>
                    <option value="rent">For rent</option>
                    <option value="auction">Auction</option>
                  </select>
                </Field>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <Field label="Street address" htmlFor="w-street">
              <input id="w-street" type="text" value={data.address.street} onChange={(e) => set('address.street', e.target.value)} className="input" placeholder="Street and number" autoComplete="street-address" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City" required htmlFor="w-city" error={errors.city}>
                <input id="w-city" type="text" value={data.address.city} onChange={(e) => set('address.city', e.target.value)} className={inputCls(errors.city)} placeholder="e.g. Prishtina" autoComplete="address-level2" />
              </Field>
              <Field label="State / region" htmlFor="w-state">
                <input id="w-state" type="text" value={data.address.state} onChange={(e) => set('address.state', e.target.value)} className="input" autoComplete="address-level1" />
              </Field>
              <Field label="Postal code" htmlFor="w-zip">
                <input id="w-zip" type="text" value={data.address.zipCode} onChange={(e) => set('address.zipCode', e.target.value)} className="input" autoComplete="postal-code" />
              </Field>
              <Field label="Country" required htmlFor="w-country" error={errors.country}>
                <input id="w-country" type="text" value={data.address.country} onChange={(e) => set('address.country', e.target.value)} className={inputCls(errors.country)} placeholder="e.g. Kosovo" autoComplete="country-name" />
              </Field>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bedrooms" required htmlFor="w-bed" error={errors.bedrooms}>
                <input id="w-bed" type="number" inputMode="numeric" min="0" value={data.details.bedrooms} onChange={(e) => set('details.bedrooms', e.target.value)} className={inputCls(errors.bedrooms)} />
              </Field>
              <Field label="Bathrooms" required htmlFor="w-bath" error={errors.bathrooms}>
                <input id="w-bath" type="number" inputMode="decimal" min="0" step="0.5" value={data.details.bathrooms} onChange={(e) => set('details.bathrooms', e.target.value)} className={inputCls(errors.bathrooms)} />
              </Field>
              <Field label="Size (m²)" htmlFor="w-size" error={errors.squareMeters}>
                <input id="w-size" type="number" inputMode="numeric" min="1" value={data.details.squareMeters} onChange={(e) => set('details.squareMeters', e.target.value)} className={inputCls(errors.squareMeters)} />
              </Field>
              <Field label="Year built" htmlFor="w-year" error={errors.yearBuilt}>
                <input id="w-year" type="number" inputMode="numeric" min="1800" max={CURRENT_YEAR + 5} value={data.details.yearBuilt} onChange={(e) => set('details.yearBuilt', e.target.value)} className={inputCls(errors.yearBuilt)} placeholder={String(CURRENT_YEAR)} />
              </Field>
              <Field label="Parking spaces" htmlFor="w-parking">
                <input id="w-parking" type="number" inputMode="numeric" min="0" value={data.details.parkingSpaces} onChange={(e) => set('details.parkingSpaces', e.target.value)} className="input" />
              </Field>
            </div>

            <fieldset>
              <legend className="label">Features</legend>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map(({ key, label }) => (
                  <Chip key={key} active={data.features[key]} onClick={() => set(`features.${key}`, !data.features[key])}>
                    {label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Amenities <span className="font-normal text-gray-500">(optional)</span></legend>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => (
                  <Chip key={amenity} active={data.amenities.includes(amenity)} onClick={() => toggleAmenity(amenity)}>
                    {amenity}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-[1fr_6.5rem] gap-3">
              <Field label={priceLabel} required htmlFor="w-price" error={errors.price}>
                <input id="w-price" type="number" inputMode="decimal" min="0" value={data.price} onChange={(e) => set('price', e.target.value)} className={inputCls(errors.price)} placeholder={isRental || ['rent', 'rental'].includes(data.listingType) ? '650' : '120000'} />
              </Field>
              <Field label="Currency" htmlFor="w-currency">
                <select id="w-currency" value={data.currency} onChange={(e) => set('currency', e.target.value)} className="input">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </Field>
            </div>

            {isRental && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Available from" required htmlFor="w-from" error={errors.availableFrom}>
                    <input id="w-from" type="date" min={todayISO()} value={data.rentalDetails.availableFrom} onChange={(e) => set('rentalDetails.availableFrom', e.target.value)} className={inputCls(errors.availableFrom)} />
                  </Field>
                  <Field label="Available until" required htmlFor="w-until" error={errors.availableUntil}>
                    <input id="w-until" type="date" min={data.rentalDetails.availableFrom || todayISO()} value={data.rentalDetails.availableUntil} onChange={(e) => set('rentalDetails.availableUntil', e.target.value)} className={inputCls(errors.availableUntil)} />
                  </Field>
                  <Field label="Minimum lease (months)" required htmlFor="w-lease" error={errors.minimumLeaseMonths}>
                    <input id="w-lease" type="number" inputMode="numeric" min="1" value={data.rentalDetails.minimumLeaseMonths} onChange={(e) => set('rentalDetails.minimumLeaseMonths', e.target.value)} className={inputCls(errors.minimumLeaseMonths)} />
                  </Field>
                  <Field label="Deposit" htmlFor="w-deposit" error={errors.depositRequired}>
                    <input id="w-deposit" type="number" inputMode="decimal" min="0" value={data.rentalDetails.depositRequired} onChange={(e) => set('rentalDetails.depositRequired', e.target.value)} className={inputCls(errors.depositRequired)} placeholder="Optional" />
                  </Field>
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                  <input type="checkbox" checked={data.rentalDetails.utilitiesIncluded} onChange={(e) => set('rentalDetails.utilitiesIncluded', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm text-gray-800">Utilities included in the rent</span>
                </label>
              </>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              className={`rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
                dragging ? 'border-brand-500 bg-brand-50' : errors.photos ? 'border-red-300 bg-red-50/40' : 'border-gray-300'
              }`}
            >
              <PhotoIcon className="mx-auto h-10 w-10 text-gray-400" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary mt-3 inline-flex items-center gap-2" disabled={photos.length >= MAX_PHOTOS}>
                <ArrowUpTrayIcon className="h-4 w-4" />
                Choose photos
              </button>
              <p className="mt-2 hidden sm:block text-sm text-gray-500">or drag and drop them here</p>
              <p className="mt-1 text-xs text-gray-500">
                Up to {MAX_PHOTOS} images, {MAX_PHOTO_MB} MB each · {photos.length}/{MAX_PHOTOS} added
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
            </div>
            {errors.photos && <p className="text-sm text-red-600" role="alert">{errors.photos}</p>}

            {photos.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <li key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                    <img src={photo.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">Cover</span>
                    ) : (
                      <button type="button" onClick={() => makeCover(photo.id)} className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 shadow">
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            {photos[0] && (
              <img src={photos[0].preview} alt="Cover" className="h-40 sm:h-56 w-full rounded-xl object-cover" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 break-words">{data.title}</h3>
              <p className="text-sm text-gray-500">
                {[data.address.street, data.address.city, data.address.country].filter((v) => !isBlank(v)).join(', ')}
              </p>
            </div>
            <p className="text-2xl font-bold text-brand-700">
              {formatMoney(data.price)}
              {(isRental || ['rent', 'rental'].includes(data.listingType)) && <span className="text-base font-medium text-gray-500"> / month</span>}
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Summary label="Type" value={data.propertyType} />
              <Summary label="Listing" value={isRental ? 'Rental' : data.listingType} />
              <Summary label="Bedrooms" value={data.details.bedrooms} />
              <Summary label="Bathrooms" value={data.details.bathrooms} />
              <Summary label="Size" value={data.details.squareMeters ? `${data.details.squareMeters} m²` : '-'} plain />
              <Summary label="Photos" value={photos.length} />
              {isRental && (
                <>
                  <Summary label="Available" value={`${data.rentalDetails.availableFrom} → ${data.rentalDetails.availableUntil}`} wide plain />
                  <Summary label="Min. lease" value={`${data.rentalDetails.minimumLeaseMonths} months`} plain />
                </>
              )}
            </dl>
            <p className="text-sm text-gray-600 whitespace-pre-line break-words">{data.description}</p>
            <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
              New listings are reviewed by an admin before they appear publicly. You can follow the status in your dashboard.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = Math.round((step / STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/50 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        className="flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-gray-100 px-4 pt-4 pb-3 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="wizard-title" className="text-lg sm:text-xl font-semibold text-gray-900">
                {isRental ? 'List a rental' : 'Create a listing'}
              </h2>
              <p className="text-sm text-gray-500">
                Step {step} of {STEPS.length} · {STEPS[step - 1]}
              </p>
            </div>
            <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile: progress bar. Desktop: step list. */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 sm:hidden" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-4 hidden sm:flex items-center gap-1">
            {STEPS.map((name, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              return (
                <li key={name} className="flex flex-1 items-center gap-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => jumpTo(n)}
                    disabled={!done}
                    className={`flex items-center gap-2 rounded-full py-1 pr-2 text-sm font-medium ${done ? 'cursor-pointer text-brand-700 hover:bg-brand-50' : 'cursor-default'} ${current ? 'text-gray-900' : !done ? 'text-gray-400' : ''}`}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        done ? 'bg-brand-600 text-white' : current ? 'border-2 border-brand-600 text-brand-700' : 'border border-gray-300'
                      }`}
                    >
                      {done ? <CheckIcon className="h-4 w-4" /> : n}
                    </span>
                    <span className="hidden md:inline">{name}</span>
                  </button>
                  {n < STEPS.length && <span className={`h-px flex-1 ${done ? 'bg-brand-600' : 'bg-gray-200'}`} />}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Body: the only scrolling area, so the buttons below are always visible. */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {submitError}
            </div>
          )}
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:rounded-b-2xl">
          <div className="flex items-center gap-3">
            {step === 1 ? (
              <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-none">
                Cancel
              </button>
            ) : (
              <button type="button" onClick={goBack} className="btn-secondary flex-1 sm:flex-none inline-flex items-center justify-center gap-1">
                <ChevronLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
            <div className="hidden sm:block sm:flex-1" />
            {step < STEPS.length ? (
              <button type="button" onClick={goNext} className="btn-primary flex-1 sm:flex-none inline-flex items-center justify-center gap-1">
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 sm:flex-none inline-flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Submit listing
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
      active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-gray-300 text-gray-700 hover:border-gray-400'
    }`}
  >
    {active && <CheckIcon className="-ml-0.5 mr-1 inline h-3.5 w-3.5" />}
    {children}
  </button>
);

const Summary = ({ label, value, wide, plain }) => (
  <div className={`rounded-lg bg-gray-50 p-3 ${wide ? 'col-span-2' : ''}`}>
    <dt className="text-xs text-gray-500">{label}</dt>
    <dd className={`font-medium text-gray-900 break-words ${plain ? '' : 'capitalize'}`}>{value === '' || value === undefined ? '-' : value}</dd>
  </div>
);

export default PropertyListingWizard;
