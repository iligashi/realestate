import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropertyCard from '../../components/PropertyCard';
import { getProperties } from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const PropertyListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    propertyType: searchParams.get('type') || '',
    listingType: searchParams.get('listingType') || '',
    minPrice: '',
    maxPrice: '',
    city: '',
    bedrooms: ''
  });
  
  // Separate state for search parameters (what gets sent to API)
  const [searchFilters, setSearchFilters] = useState(filters);

  // Update filters when URL params change
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    const listingTypeFromUrl = searchParams.get('listingType');
    
    if (typeFromUrl !== filters.propertyType || listingTypeFromUrl !== filters.listingType) {
      const newFilters = {
        ...filters,
        propertyType: typeFromUrl || '',
        listingType: listingTypeFromUrl || ''
      };
      setFilters(newFilters);
      setSearchFilters(newFilters);
    }
  }, [searchParams, filters.propertyType, filters.listingType]);

  useEffect(() => {
    fetchProperties();
  }, [searchFilters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties(searchFilters);
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    
    // For dropdowns (propertyType, bedrooms), search immediately
    if (key === 'propertyType' || key === 'bedrooms') {
      setSearchFilters(newFilters);
      
      // Update URL params when property type changes
      if (key === 'propertyType') {
        if (value) {
          setSearchParams({ type: value });
        } else {
          setSearchParams({});
        }
      }
    }
  };

  const handleSearch = () => {
    setSearchFilters(filters);
  };

  // Check if there are unsaved filter changes
  const hasUnsavedChanges = JSON.stringify(filters) !== JSON.stringify(searchFilters);

  // Handle Enter key press in input fields
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      propertyType: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      bedrooms: ''
    };
    setFilters(clearedFilters);
    setSearchFilters(clearedFilters);
    setSearchParams({}); // Clear URL params
  };

  // Get page title based on property type and listing type filters
  const getPageTitle = () => {
    let title = 'All Properties';
    
    if (searchFilters.listingType === 'sale') {
      title = 'Properties for Sale';
    } else if (searchFilters.listingType === 'rental') {
      title = 'Properties for Rent';
    }
    
    if (searchFilters.propertyType) {
      const propertyType = searchFilters.propertyType.charAt(0).toUpperCase() + searchFilters.propertyType.slice(1);
      if (searchFilters.listingType === 'sale') {
        title = `${propertyType}s for Sale`;
      } else if (searchFilters.listingType === 'rental') {
        title = `${propertyType}s for Rent`;
      } else {
        title = `${propertyType}s`;
      }
    }
    
    return title;
  };

  // Get page description based on property type and listing type filters
  const getPageDescription = () => {
    if (searchFilters.listingType === 'sale') {
      return 'Find your perfect property to buy';
    } else if (searchFilters.listingType === 'rental') {
      return 'Find your perfect property to rent';
    } else if (searchFilters.propertyType) {
      return `Browse our selection of ${searchFilters.propertyType}s`;
    }
    return 'Find your perfect property';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-gray-600 mt-2">{getPageDescription()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {hasUnsavedChanges && (
              <span className="text-sm text-blue-600 font-medium">
                • You have unsaved filter changes
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="office">Office</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price
              </label>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
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
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">
              {searchFilters.propertyType 
                ? `No ${searchFilters.propertyType}s found with the current filters.` 
                : 'Try adjusting your filters to find properties.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}

        {/* Results Count */}
        {properties.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            {searchFilters.propertyType && ` of type ${searchFilters.propertyType}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyListPage;
