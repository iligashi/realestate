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
  XMarkIcon,
  PlusIcon,
  ScaleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const PropertyComparison = () => {
  const dispatch = useDispatch();
  const { properties = [] } = useSelector(state => state.property || {});
  const [favorites, setFavorites] = useState([]);
  
  const [comparisonList, setComparisonList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  const handleAddToComparison = (property) => {
    if (comparisonList.length >= 4) {
      toast.error('You can compare up to 4 properties at once');
      return;
    }
    
    if (comparisonList.some(p => p._id === property._id)) {
      toast.error('Property already in comparison');
      return;
    }
    
    setComparisonList(prev => [...prev, property]);
    setShowAddModal(false);
    toast.success('Property added to comparison');
  };

  const handleRemoveFromComparison = (propertyId) => {
    setComparisonList(prev => prev.filter(p => p._id !== propertyId));
  };

  const handleAddToFavorites = async (propertyId) => {
    // TODO: Implement favorites functionality
    toast.success('Added to wishlist!');
  };

  const handleRemoveFromFavorites = async (propertyId) => {
    // TODO: Implement favorites functionality
    toast.success('Removed from wishlist!');
  };

  const isFavorite = (propertyId) => {
    // TODO: Implement favorites functionality
    return false;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculatePricePerSqft = (price, sqft) => {
    if (!sqft) return 'N/A';
    return formatPrice(price / sqft);
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ComparisonTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Property
            </th>
            {comparisonList.map((property) => (
              <th key={property._id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="relative">
                  <img
                    src={property.photos?.[0]?.url || '/api/placeholder/200/150'}
                    alt={property.title}
                    className="w-24 h-16 object-cover rounded mx-auto mb-2"
                  />
                  <button
                    onClick={() => handleRemoveFromComparison(property._id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {property.title}
                  </h3>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Price
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {formatPrice(property.price)}
                </div>
                <div className="text-xs text-gray-500">
                  {calculatePricePerSqft(property.price, property.details?.squareMeters)}/m²
                </div>
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Location
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                <div className="flex items-center justify-center">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{property.address?.city}, {property.address?.state}</span>
                </div>
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Property Type
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {property.propertyType}
                </span>
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Bedrooms
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                <div className="flex items-center justify-center">
                  <HomeIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{property.details?.bedrooms || 0}</span>
                </div>
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Bathrooms
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {property.details?.bathrooms || 0}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Square Meters
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {property.details?.squareMeters?.toLocaleString() || '0'} m²
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Year Built
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {property.yearBuilt || 'N/A'}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Days on Market
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {property.daysOnMarket || 0} days
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Actions
            </td>
            {comparisonList.map((property) => (
              <td key={property._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                <div className="flex space-x-2 justify-center">
                  <button
                    onClick={() => window.open(`/properties/${property._id}`, '_blank')}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => isFavorite(property._id) 
                      ? handleRemoveFromFavorites(property._id)
                      : handleAddToFavorites(property._id)
                    }
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center ${
                      isFavorite(property._id)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    <HeartIcon className="h-3 w-3 mr-1" />
                    {isFavorite(property._id) ? 'Remove' : 'Save'}
                  </button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Comparison</h2>
          <p className="text-gray-600">
            Compare up to 4 properties side by side
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={comparisonList.length >= 4}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Property
          </button>
        </div>
      </div>

      {/* Comparison List Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <ScaleIcon className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {comparisonList.length} of 4 properties selected
            </span>
          </div>
          {comparisonList.length > 0 && (
            <button
              onClick={() => setComparisonList([])}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {comparisonList.length === 0 ? (
        <div className="text-center py-12">
          <ScaleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties to compare</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add properties to start comparing features and prices.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Properties
          </button>
        </div>
      ) : (
        <ComparisonTable />
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add Property to Comparison</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No properties found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProperties.map((property) => (
                    <div
                      key={property._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={property.photos?.[0]?.url || '/api/placeholder/60/60'}
                          alt={property.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{property.title}</h4>
                          <p className="text-xs text-gray-500">
                            {property.address?.city}, {property.address?.state} • {formatPrice(property.price)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToComparison(property)}
                        disabled={comparisonList.some(p => p._id === property._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {comparisonList.some(p => p._id === property._id) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyComparison;
