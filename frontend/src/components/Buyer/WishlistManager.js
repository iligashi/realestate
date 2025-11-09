import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProperties } from '../../store/slices/propertySlice';
import {
  HeartIcon,
  EyeIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import favoriteAPI from '../../services/favoriteAPI';

const WishlistManager = () => {
  const dispatch = useDispatch();
  const { properties = [], loading: propertiesLoading = false } = useSelector(state => state.property || {});

  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const response = await favoriteAPI.getFavorites();
      const normalized = (response.favorites || []).map((favorite) => {
        const property = favorite.property || {};
        const address = typeof property.address === 'string'
          ? safeParseJSON(property.address, {})
          : property.address || {};
        const photos = Array.isArray(property.photos)
          ? property.photos
          : safeParseJSON(property.photos, []);

        return {
          favoriteId: favorite.favoriteId || favorite.id,
          propertyId: favorite.propertyId || property.id || property._id,
          savedAt: favorite.savedAt || favorite.dateAdded,
          notes: favorite.notes,
          priority: favorite.priority,
          tags: favorite.tags || [],
          alerts: favorite.alerts || {},
          ...property,
          id: property.id || property._id,
          _id: property._id || property.id,
          address,
          photos
        };
      });
      setFavorites(normalized);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error(error?.response?.data?.message || 'Failed to load wishlist');
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFromFavorites = async (favoriteId, propertyId) => {
    try {
      if (favoriteId) {
        await favoriteAPI.removeFavorite(favoriteId);
      } else if (propertyId) {
        await favoriteAPI.removeFavoriteByProperty(propertyId);
      }
      toast.success('Removed from wishlist');
      await loadFavorites();
    } catch (error) {
      console.error('Remove favorite error:', error);
      toast.error(error?.response?.data?.message || 'Failed to remove favorite');
    }
  };

  const handleAddToFavorites = async (propertyId) => {
    try {
      await favoriteAPI.addFavorite(propertyId);
      toast.success('Added to wishlist');
      await loadFavorites();
    } catch (error) {
      console.error('Add favorite error:', error);
      toast.error(error?.response?.data?.message || 'Failed to add property to wishlist');
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    if (price == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredFavorites = useMemo(() => favorites.filter(favorite => {
    if (filterType === 'all') return true;
    return (favorite.propertyType || '').toLowerCase() === filterType.toLowerCase();
  }), [favorites, filterType]);

  const sortedFavorites = useMemo(() => [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'dateAdded':
        return new Date(b.savedAt || b.dateAdded) - new Date(a.savedAt || a.dateAdded);
      case 'size':
        return (b.details?.squareMeters || 0) - (a.details?.squareMeters || 0);
      default:
        return 0;
    }
  }), [filteredFavorites, sortBy]);

  const WishlistCard = ({ favorite }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={favorite.photos?.[0]?.url || favorite.photos?.[0] || '/api/placeholder/400/300'}
          alt={favorite.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={() => handleRemoveFromFavorites(favorite.favoriteId, favorite.propertyId)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {favorite.propertyType || 'N/A'}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            Added {formatDate(favorite.savedAt || favorite.dateAdded)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {favorite.title}
          </h3>
          <span className="text-xl font-bold text-blue-600">
            {formatPrice(favorite.price, favorite.currency)}
          </span>
        </div>

        <div className="flex items-center text-gray-600 mb-3">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {favorite.address?.city || 'Unknown'}, {favorite.address?.state || ''}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <HomeIcon className="h-4 w-4 mr-1" />
              <span>{favorite.details?.bedrooms || 0} bed</span>
            </div>
            <div className="flex items-center">
              <span>{favorite.details?.bathrooms || 0} bath</span>
            </div>
            <div className="flex items-center">
              <span>{favorite.details?.squareMeters?.toLocaleString() || '0'} m²</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => window.open(`/properties/${favorite.propertyId || favorite.id}`, '_blank')}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </button>
          <button
            onClick={() => window.open(`/buyer?tab=messages&property=${favorite.propertyId || favorite.id}`, '_blank')}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Contact
          </button>
        </div>
      </div>
    </div>
  );

  const WishlistListItem = ({ favorite }) => (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
      <div className="flex space-x-4">
        <div className="relative flex-shrink-0">
          <img
            src={favorite.photos?.[0]?.url || favorite.photos?.[0] || '/api/placeholder/200/150'}
            alt={favorite.title}
            className="w-32 h-24 object-cover rounded-lg"
          />
          <button
            onClick={() => handleRemoveFromFavorites(favorite.favoriteId, favorite.propertyId)}
            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <HeartSolidIcon className="h-4 w-4 text-red-500" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {favorite.title}
            </h3>
            <span className="text-xl font-bold text-blue-600 ml-4">
              {formatPrice(favorite.price, favorite.currency)}
            </span>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {favorite.address?.city || 'Unknown'}, {favorite.address?.state || ''}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <HomeIcon className="h-4 w-4 mr-1" />
              <span>{favorite.details?.bedrooms || 0} bed</span>
            </div>
            <div className="flex items-center">
              <span>{favorite.details?.bathrooms || 0} bath</span>
            </div>
            <div className="flex items-center">
              <span>{favorite.details?.squareMeters?.toLocaleString() || '0'} m²</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600">Added {formatDate(favorite.savedAt || favorite.dateAdded)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/properties/${favorite.propertyId || favorite.id}`, '_blank')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </button>
            <button
              onClick={() => window.open(`/buyer?tab=messages&property=${favorite.propertyId || favorite.id}`, '_blank')}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Contact
            </button>
            <button
              onClick={() => window.open(`/buyer?tab=compare&add=${favorite.propertyId || favorite.id}`, '_blank')}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <ScaleIcon className="h-4 w-4 mr-2" />
              Compare
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const availableProperties = useMemo(() => {
    const savedIds = new Set(favorites.map(fav => fav.propertyId));
    return properties.filter(property => !savedIds.has(property._id || property.id));
  }, [favorites, properties]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
          <p className="text-gray-600">
            {favorites.length} saved propert{favorites.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        <div className="flex space-x-3">
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <HomeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
        <div className="flex space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="house">Houses</option>
            <option value="apartment">Apartments</option>
            <option value="condo">Condos</option>
            <option value="townhouse">Townhouses</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="dateAdded">Date Added</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="size">Size: Largest First</option>
          </select>
        </div>
      </div>

      {/* Wishlist Content */}
      {favoritesLoading || propertiesLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties in wishlist</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start browsing properties and add them to your wishlist.
          </p>
          <button
            onClick={() => window.open('/properties', '_blank')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </button>
          {availableProperties.length > 0 && (
            <div className="mt-6 max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add from available properties
              </label>
              <select
                defaultValue=""
                onChange={async (e) => {
                  const value = e.target.value;
                  if (!value) return;
                  await handleAddToFavorites(value);
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select property</option>
                {availableProperties.map(property => (
                  <option key={property._id || property.id} value={property._id || property.id}>
                    {property.title} — {property.address?.city}, {property.address?.state}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {sortedFavorites.map((favorite) => (
            viewMode === 'grid' ? (
              <WishlistCard key={favorite.favoriteId || favorite.propertyId} favorite={favorite} />
            ) : (
              <WishlistListItem key={favorite.favoriteId || favorite.propertyId} favorite={favorite} />
            )
          ))}
        </div>
      )}
    </div>
  );
};

const safeParseJSON = (value, fallback) => {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export default WishlistManager;

