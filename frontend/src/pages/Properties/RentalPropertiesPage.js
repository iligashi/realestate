import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import PropertyCard from '../../components/PropertyCard';
import { getProperties } from '../../services/propertyService';

const RentalPropertiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector(state => state.auth || {});
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    propertyType: searchParams.get('type') || '',
    minPrice: '',
    maxPrice: '',
    city: '',
    bedrooms: '',
    bathrooms: ''
  });
  
  // Separate state for search parameters (what gets sent to API)
  const [searchFilters, setSearchFilters] = useState({
    ...filters,
    listingType: 'rental' // Always filter for rental properties
  });

  // Update filters when URL params change
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    
    if (typeFromUrl !== filters.propertyType) {
      const newFilters = {
        ...filters,
        propertyType: typeFromUrl || ''
      };
      setFilters(newFilters);
      setSearchFilters({
        ...newFilters,
        listingType: 'rental'
      });
    }
  }, [searchParams, filters.propertyType]);

  useEffect(() => {
    fetchProperties();
  }, [searchFilters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties(searchFilters);
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching rental properties:', error);
      toast.error('Failed to fetch rental properties');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    setSearchFilters({
      ...filters,
      listingType: 'rental'
    });
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    if (filters.propertyType) newSearchParams.set('type', filters.propertyType);
    if (filters.city) newSearchParams.set('city', filters.city);
    if (filters.minPrice) newSearchParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) newSearchParams.set('maxPrice', filters.maxPrice);
    if (filters.bedrooms) newSearchParams.set('bedrooms', filters.bedrooms);
    if (filters.bathrooms) newSearchParams.set('bathrooms', filters.bathrooms);
    
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    const clearedFilters = {
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      bedrooms: '',
      bathrooms: ''
    };
    setFilters(clearedFilters);
    setSearchFilters({
      ...clearedFilters,
      listingType: 'rental'
    });
    setSearchParams({});
  };

  const hasUnsavedChanges = JSON.stringify(filters) !== JSON.stringify({
    propertyType: searchFilters.propertyType,
    minPrice: searchFilters.minPrice,
    maxPrice: searchFilters.maxPrice,
    city: searchFilters.city,
    bedrooms: searchFilters.bedrooms,
    bathrooms: searchFilters.bathrooms
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Rental
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover amazing rental properties and apply directly through our platform. 
            Start your rental journey today!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(properties.map(p => p.address?.city)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Rent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${properties.length > 0 
                    ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).toLocaleString()
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Now</p>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (per month)
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (per month)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={handleSearch}
              className={`px-6 py-2 rounded-md transition-colors duration-200 font-medium ${
                hasUnsavedChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {hasUnsavedChanges ? 'Apply Filters' : 'Search Properties'}
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <HomeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rental properties found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or check back later for new listings.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {properties.length} Rental Properties Found
              </h2>
              <div className="text-sm text-gray-600">
                Showing {properties.length} of {properties.length} properties
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Find Your Next Home?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of renters who have found their perfect home through our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Sign Up to Apply
              </button>
              <button className="px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-green-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalPropertiesPage;
