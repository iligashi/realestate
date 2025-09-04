import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchProperties
} from '../../store/slices/propertySlice';
import { 
  HeartIcon, 
  EyeIcon, 
  MapPinIcon, 
  HomeIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const WishlistManager = () => {
  const dispatch = useDispatch();
  const { properties = [], loading = false } = useSelector(state => state.property || {});
  const [favorites, setFavorites] = useState([]);
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  const handleRemoveFromFavorites = async (propertyId) => {
    // TODO: Implement favorites functionality
    setFavorites(prev => prev.filter(fav => fav._id !== propertyId));
    toast.success('Removed from wishlist!');
  };

  const handleAddToFavorites = async (propertyId) => {
    // TODO: Implement favorites functionality
    const property = properties.find(p => p._id === propertyId);
    if (property && !favorites.some(fav => fav._id === propertyId)) {
      setFavorites(prev => [...prev, { ...property, dateAdded: new Date().toISOString() }]);
      toast.success('Added to wishlist!');
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredFavorites = favorites.filter(favorite => {
    if (filterType === 'all') return true;
    return favorite.propertyType === filterType;
  });

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'dateAdded':
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      case 'size':
        return (b.details?.squareMeters || 0) - (a.details?.squareMeters || 0);
      default:
        return 0;
    }
  });

  const WishlistCard = ({ favorite }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={favorite.photos?.[0]?.url || '/api/placeholder/400/300'}
          alt={favorite.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={() => handleRemoveFromFavorites(favorite._id)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {favorite.propertyType}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            Added {formatDate(favorite.dateAdded)}
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
            {favorite.address?.city}, {favorite.address?.state}
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
            onClick={() => window.open(`/properties/${favorite._id}`, '_blank')}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </button>
          <button
            onClick={() => window.open(`/buyer?tab=messages&property=${favorite._id}`, '_blank')}
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
            src={favorite.photos?.[0]?.url || '/api/placeholder/200/150'}
            alt={favorite.title}
            className="w-32 h-24 object-cover rounded-lg"
          />
          <button
            onClick={() => handleRemoveFromFavorites(favorite._id)}
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
              {favorite.address?.city}, {favorite.address?.state}
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
              <span className="text-green-600">Added {formatDate(favorite.dateAdded)}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/properties/${favorite._id}`, '_blank')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </button>
            <button
              onClick={() => window.open(`/buyer?tab=messages&property=${favorite._id}`, '_blank')}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Contact
            </button>
            <button
              onClick={() => window.open(`/buyer?tab=compare&add=${favorite._id}`, '_blank')}
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
      {loading ? (
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
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {sortedFavorites.map((favorite) => (
            viewMode === 'grid' ? (
              <WishlistCard key={favorite._id} favorite={favorite} />
            ) : (
              <WishlistListItem key={favorite._id} favorite={favorite} />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistManager;
