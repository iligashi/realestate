import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MapPinIcon,
  HomeIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { getProperty } from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real property data from backend
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getProperty(id);
        if (response && response.property) {
          setProperty(response.property);
          
          // Set primary image as first image if available
          if (response.property.photos && response.property.photos.length > 0) {
            const primaryIndex = response.property.photos.findIndex(photo => photo.isPrimary);
            if (primaryIndex !== -1) {
              setCurrentImageIndex(primaryIndex);
            }
          }
        } else {
          setError('Property not found');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property details');
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Handle case when no photos are available
  const hasPhotos = property && property.photos && property.photos.length > 0;
  const currentPhoto = hasPhotos ? property.photos[currentImageIndex] : null;

  const nextImage = () => {
    if (!hasPhotos) return;
    setCurrentImageIndex((prev) => 
      prev === property.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!hasPhotos) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.photos.length - 1 : prev - 1
    );
  };

  const goToImage = (index) => {
    if (!hasPhotos) return;
    setCurrentImageIndex(index);
  };

  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'apartment':
        return <BuildingOfficeIcon className="w-5 h-5" />;
      case 'house':
        return <HomeIcon className="w-5 h-5" />;
      case 'office':
        return <BuildingOfficeIcon className="w-5 h-5" />;
      default:
        return <HomeIcon className="w-5 h-5" />;
    }
  };

  const getPropertyTypeName = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The property you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/properties')}
          className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2"
        >
          ← Back to Properties
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-gray-600">
          <div className="flex items-center gap-2">
            {getPropertyTypeIcon(property.propertyType)}
            <span>{getPropertyTypeName(property.propertyType)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-5 h-5" />
            <span>{property.address.city}, {property.address.state}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Image Slider and Details */}
        <div className="lg:col-span-2">
          {/* Main Image Slider */}
          <div className="mb-8">
            <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden">
              {hasPhotos ? (
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || 'Property image'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BuildingOfficeIcon className="h-16 w-16 mx-auto mb-2" />
                    <p>No images available</p>
                  </div>
                </div>
              )}
              
              {/* Navigation Arrows */}
              {hasPhotos && property.photos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {hasPhotos && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {property.photos.length}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {hasPhotos && property.photos.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {property.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-green-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || `Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
            
            {/* Property Type Badge */}
            <div className="flex items-center gap-2 mb-4">
              {getPropertyTypeIcon(property.propertyType)}
              <span className="text-sm text-gray-600">
                {getPropertyTypeName(property.propertyType)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                property.status === 'active' ? 'bg-green-100 text-green-800' :
                property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                property.status === 'rented' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-green-600 mb-4">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: property.currency || 'USD'
              }).format(property.price)}
            </div>

            {/* Address */}
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <MapPinIcon className="h-5 w-5" />
              <span>
                {property.address.street && `${property.address.street}, `}
                {property.address.city}
                {property.address.state && `, ${property.address.state}`}
                {property.address.zipCode && ` ${property.address.zipCode}`}
                {property.address.country && `, ${property.address.country}`}
              </span>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{property.details.bedrooms || 0}</div>
                <div className="text-sm text-gray-600">Bedrooms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{property.details.bathrooms || 0}</div>
                <div className="text-sm text-gray-600">Bathrooms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{property.details.squareMeters || 0}</div>
                <div className="text-sm text-gray-600">m²</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{property.details.yearBuilt || 'N/A'}</div>
                <div className="text-sm text-gray-600">Year Built</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {/* Features */}
            {property.features && Object.keys(property.features).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(property.features).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Contact & Owner Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
            {/* Contact Actions */}
            <div className="space-y-3 mb-6">
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Contact Owner
              </button>
              <button className="w-full border border-green-600 text-green-600 py-3 px-4 rounded-lg font-medium hover:bg-green-50 transition-colors">
                Schedule Viewing
              </button>
            </div>

            {/* Owner Information */}
            {property.owner && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Owner</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {property.owner.firstName} {property.owner.lastName}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {property.owner.userType || 'Owner'}
                    </p>
                  </div>
                </div>
                
                {/* Contact Details */}
                <div className="space-y-2">
                  {property.owner.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{property.owner.phone}</span>
                    </div>
                  )}
                  {property.owner.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{property.owner.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Property Status */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    property.status === 'active' ? 'text-green-600' :
                    property.status === 'sold' ? 'text-blue-600' :
                    property.status === 'rented' ? 'text-purple-600' :
                    'text-gray-600'
                  }`}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed:</span>
                  <span className="font-medium text-gray-900">
                    {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
