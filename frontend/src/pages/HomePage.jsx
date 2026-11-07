import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { propertyImage } from '../config';
import FavoriteButton from '../components/FavoriteButton';

// Enhanced Announcements Component
const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch active announcements
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get('/announcements');
        setAnnouncements(data.announcements || []);
      } catch (error) {
        console.log('No announcements to display');
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 6000); // Change announcement every 6 seconds

      return () => clearInterval(timer);
    }
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  // Get announcement type styling
  const getTypeStyle = (type) => {
    switch (type) {
      case 'general':
        return 'bg-brand-50 border-brand-200 text-brand-800';
      case 'update':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'promotion':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'maintenance':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'general':
        return '📢';
      case 'update':
        return '✨';
      case 'promotion':
        return '🎉';
      case 'maintenance':
        return '🔧';
      case 'alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`${getTypeStyle(currentAnnouncement.type)} border-b transition-all duration-500 ease-in-out`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon(currentAnnouncement.type)}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {currentAnnouncement.type === 'general' ? 'News' : 
                   currentAnnouncement.type === 'update' ? 'Update' : 
                   currentAnnouncement.type === 'promotion' ? 'Special Offer' : 
                   currentAnnouncement.type === 'maintenance' ? 'Maintenance' :
                   currentAnnouncement.type === 'alert' ? 'Alert' : 'Announcement'}
                </span>
                {announcements.length > 1 && (
                  <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                    {currentIndex + 1} of {announcements.length}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-bold">{currentAnnouncement.title}</h3>
              {currentAnnouncement.priority === 'high' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Important
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {announcements.length > 1 && (
              <div className="flex space-x-1">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-current' : 'bg-current/30'
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="hover:scale-110 transition-transform duration-200"
              title="Dismiss announcement"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {currentAnnouncement.content && (
          <p className="mt-2 text-sm opacity-90 max-w-4xl">
            {currentAnnouncement.content}
          </p>
        )}
      </div>
    </div>
  );
};

const formatPrice = (price, listingType) => {
  const value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price || 0);
  return ['rent', 'rental'].includes(listingType) ? `${value}/mo` : value;
};

const ListingCard = ({ property }) => (
  <Link to={`/properties/${property._id}`} className="card-plain group block overflow-hidden transition-shadow hover:shadow-md">
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      <img
        src={propertyImage(property.photos)}
        alt={property.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <FavoriteButton propertyId={property._id} className="absolute right-3 top-3" />
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-gray-800 backdrop-blur">
        For {['rent', 'rental'].includes(property.listingType) ? 'rent' : 'sale'}
      </span>
    </div>
    <div className="p-5">
      <p className="text-lg font-bold text-gray-900">{formatPrice(property.price, property.listingType)}</p>
      <h3 className="mt-1 truncate font-medium text-gray-800">{property.title}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
        <MapPinIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="truncate">{[property.address?.city, property.address?.state].filter(Boolean).join(', ')}</span>
      </p>
      <p className="mt-3 flex gap-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
        {property.details?.bedrooms != null && <span>{property.details.bedrooms} beds</span>}
        {property.details?.bathrooms != null && <span>{property.details.bathrooms} baths</span>}
        {property.details?.squareMeters != null && <span>{property.details.squareMeters} m²</span>}
      </p>
    </div>
  </Link>
);

const HeroSearch = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [city, setCity] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (city.trim()) params.set('city', city.trim());
    navigate(`/properties${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <form onSubmit={submit} className="mt-10 flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row" role="search">
      <label className="sr-only" htmlFor="hero-city">City</label>
      <div className="relative flex-1">
        <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          id="hero-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, e.g. Miami"
          className="h-12 w-full rounded-xl border-0 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <label className="sr-only" htmlFor="hero-type">Property type</label>
      <select
        id="hero-type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="h-12 rounded-xl border-0 bg-gray-50 px-3 text-gray-700 focus:ring-2 focus:ring-brand-500 sm:w-40"
      >
        <option value="">Any type</option>
        <option value="house">Houses</option>
        <option value="apartment">Apartments</option>
        <option value="office">Offices</option>
      </select>
      <button type="submit" className="btn-primary h-12 px-6">
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        Search
      </button>
    </form>
  );
};

const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    api
      .get('/properties', { params: { limit: 6 } })
      .then(({ data }) => setLatest(data.properties || []))
      .catch(() => setLatest([]));
  }, []);

  const canSell = isAuthenticated && ['seller', 'agent', 'admin'].includes(user?.userType);
  const canRentOut = isAuthenticated && ['renter', 'seller', 'agent', 'admin'].includes(user?.userType);
  const collage = (latest || []).filter((p) => p.photos?.length).slice(0, 3);

  const steps = [
    { icon: MagnifyingGlassIcon, title: 'Search', text: 'Filter by city, type, price and bedrooms to find places that fit.' },
    { icon: ChatBubbleLeftRightIcon, title: 'Talk to the owner', text: 'Message owners and agents directly, in real time.' },
    { icon: CalendarDaysIcon, title: 'Book a viewing', text: 'Pick a date and time; the owner confirms it in their dashboard.' }
  ];

  return (
    <div className="bg-white">
      <Announcements />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gray-950">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_10%_-10%,rgba(22,163,74,0.35),transparent),radial-gradient(40rem_30rem_at_90%_110%,rgba(22,163,74,0.18),transparent)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-brand-200">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              Reviewed listings, direct contact with owners
            </p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find a place that <span className="text-brand-400">feels like home</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
              Homes, apartments and offices for sale or rent. Search, message owners and book viewings, all in one place.
            </p>
            <HeroSearch />
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {canSell && (
                <Link to="/properties/create" className="font-medium text-white hover:text-brand-300">
                  List a property for sale →
                </Link>
              )}
              {canRentOut && (
                <Link to="/properties/create-rental" className="font-medium text-white hover:text-brand-300">
                  List a property for rent →
                </Link>
              )}
              {!isAuthenticated && (
                <Link to="/register" className="font-medium text-white hover:text-brand-300">
                  Own a property? List it free →
                </Link>
              )}
            </div>
          </div>

          {collage.length > 0 && (
            <div className="relative hidden h-[30rem] lg:block" aria-hidden="true">
              {collage.map((p, i) => (
                <img
                  key={p._id}
                  src={propertyImage(p.photos)}
                  alt=""
                  className={`absolute rounded-3xl object-cover shadow-2xl ring-1 ring-white/10 ${
                    [
                      'right-0 top-0 h-72 w-80',
                      'left-4 top-24 h-64 w-72',
                      'bottom-0 right-16 h-56 w-64'
                    ][i]
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest listings */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Latest properties</h2>
            <p className="mt-2 text-gray-600">Freshly listed homes and spaces.</p>
          </div>
          <Link to="/properties" className="btn-secondary">
            View all <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest === null
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-plain animate-pulse overflow-hidden" aria-hidden="true">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-1/3 rounded bg-gray-100" />
                    <div className="h-4 w-2/3 rounded bg-gray-100" />
                  </div>
                </div>
              ))
            : latest.map((p) => <ListingCard key={p._id} property={p} />)}
        </div>
        {latest?.length === 0 && (
          <p className="mt-6 text-center text-gray-500">No listings yet. Be the first to publish one.</p>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-brand-700">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-14 text-center sm:px-12">
          <div className="absolute inset-0 -z-0 bg-[radial-gradient(30rem_20rem_at_80%_0%,rgba(255,255,255,0.15),transparent)]" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {isAuthenticated ? 'Pick up where you left off' : 'Start your search today'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              {isAuthenticated
                ? 'Your saved properties, messages and viewings are waiting in your dashboard.'
                : 'Create a free account to save properties, message owners and book viewings.'}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="btn bg-white px-6 py-3 text-base text-brand-800 shadow-sm hover:bg-brand-50"
              >
                {isAuthenticated ? 'Go to dashboard' : 'Create free account'}
              </Link>
              <Link to="/properties" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
                Browse properties
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile quick-create button for people who can list */}
      {(canSell || canRentOut) && (
        <Link
          to={canSell ? '/properties/create' : '/properties/create-rental'}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 lg:hidden"
          aria-label="List a property"
        >
          <PlusIcon className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
};

export default HomePage;
