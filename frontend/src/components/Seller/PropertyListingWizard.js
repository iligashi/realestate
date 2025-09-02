import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '../../store/slices/propertySlice';
import { 
  PhotoIcon, 
  MapPinIcon, 
  HomeIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const PropertyListingWizard = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.property);
  const fileInputRef = useRef(null);
  
  // Consistent form input styling
  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
  const selectClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    currency: 'USD',
    
    // Location
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    
    // Property Details
    details: {
      bedrooms: '',
      bathrooms: '',
      squareMeters: '',
      yearBuilt: '',
      parkingSpaces: ''
    },
    
    // Features
    features: {
      parkingAvailable: false,
      furnished: false,
      petFriendly: false,
      featured: false
    },
    
    // Amenities
    amenities: []
  });
  
  const [photos, setPhotos] = useState([]);
  const [amenitiesList] = useState([
    'Swimming Pool', 'Gym', 'Parking', 'Balcony', 'Garden', 'Air Conditioning',
    'Heating', 'Dishwasher', 'Washing Machine', 'Dryer', 'Internet', 'Cable TV',
    'Security System', 'Elevator', 'Concierge', 'Pet Friendly', 'Furnished'
  ]);

  const steps = [
    { id: 1, name: 'Basic Info', icon: DocumentTextIcon },
    { id: 2, name: 'Location', icon: MapPinIcon },
    { id: 3, name: 'Details', icon: HomeIcon },
    { id: 4, name: 'Pricing', icon: CurrencyDollarIcon },
    { id: 5, name: 'Photos', icon: PhotoIcon },
    { id: 6, name: 'Review', icon: CheckCircleIcon }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = new FormData();
      
      // Add basic property data
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('propertyType', formData.propertyType);
      submitData.append('listingType', formData.listingType);
      submitData.append('price', formData.price);
      submitData.append('currency', formData.currency);
      submitData.append('status', 'pending');
      
      // Add address data
      submitData.append('address[street]', formData.address.street);
      submitData.append('address[city]', formData.address.city);
      submitData.append('address[state]', formData.address.state);
      submitData.append('address[zipCode]', formData.address.zipCode);
      submitData.append('address[country]', formData.address.country);
      
      // Add location data (required by schema)
      submitData.append('location[type]', 'Point');
      submitData.append('location[coordinates][0]', '0');
      submitData.append('location[coordinates][1]', '0');
      
      // Add property details
      submitData.append('details[bedrooms]', formData.details.bedrooms);
      submitData.append('details[bathrooms]', formData.details.bathrooms);
      submitData.append('details[squareMeters]', formData.details.squareMeters);
      submitData.append('details[yearBuilt]', formData.details.yearBuilt);
      
      // Add features
      submitData.append('features[parkingAvailable]', formData.features.parkingAvailable);
      submitData.append('features[furnished]', formData.features.furnished);
      submitData.append('features[petFriendly]', formData.features.petFriendly);
      submitData.append('features[featured]', formData.features.featured);
      
      // Add amenities
      formData.amenities.forEach(amenity => {
        submitData.append('amenities', amenity);
      });
      
      // Add photos
      photos.forEach(photo => {
        submitData.append('images', photo.file);
      });
      
      // Use the existing createProperty action
      await dispatch(createProperty(submitData)).unwrap();
      
      // Close modal and redirect to properties
      onClose();
      navigate('/properties');
    } catch (error) {
      console.error('Failed to create property listing:', error);
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.propertyType && formData.listingType;
      case 2:
        return formData.address.city && formData.address.country;
      case 3:
        return formData.details.bedrooms && formData.details.bathrooms;
      case 4:
        return formData.price && parseFloat(formData.price) > 0;
      case 5:
        return photos.length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={inputClasses}
                placeholder="e.g., Beautiful 3-bedroom apartment in downtown"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Describe your property in detail..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className={selectClasses}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Type *
                </label>
                <select
                  value={formData.listingType}
                  onChange={(e) => handleInputChange('listingType', e.target.value)}
                  className={selectClasses}
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                  <option value="auction">Auction</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className={inputClasses}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={inputClasses}
                  placeholder="New York"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className={inputClasses}
                  placeholder="NY"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  className={inputClasses}
                  placeholder="10001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className={selectClasses}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.details.bedrooms}
                  onChange={(e) => handleInputChange('details.bedrooms', e.target.value)}
                  className={inputClasses}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.details.bathrooms}
                  onChange={(e) => handleInputChange('details.bathrooms', e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Square Meters
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.details.squareMeters}
                  onChange={(e) => handleInputChange('details.squareMeters', e.target.value)}
                  className={inputClasses}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Built
                </label>
                <input
                  type="number"
                  min="1800"
                  max="2025"
                  value={formData.details.yearBuilt}
                  onChange={(e) => handleInputChange('details.yearBuilt', e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parking Spaces
              </label>
              <input
                type="number"
                min="0"
                value={formData.details.parkingSpaces}
                onChange={(e) => handleInputChange('details.parkingSpaces', e.target.value)}
                className={inputClasses}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Features
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(formData.features).map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features[feature]}
                      onChange={(e) => handleInputChange(`features.${feature}`, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {amenitiesList.map(amenity => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={inputClasses}
                  placeholder="500000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className={selectClasses}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Photos *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload photos</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>
            </div>
            
            {photos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.preview}
                        alt={photo.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Listing</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{formData.title}</h4>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {formData.propertyType}
                  </div>
                  <div>
                    <span className="font-medium">Listing:</span> {formData.listingType}
                  </div>
                  <div>
                    <span className="font-medium">Bedrooms:</span> {formData.details.bedrooms}
                  </div>
                  <div>
                    <span className="font-medium">Bathrooms:</span> {formData.details.bathrooms}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {formData.address.city}, {formData.address.state}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> {formData.currency} {parseFloat(formData.price).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Photos:</span> {photos.length} uploaded
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create Property Listing</h2>
              <p className="text-blue-100 mt-1">Step {currentStep} of {steps.length}</p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white transition-colors p-2 rounded-full hover:bg-blue-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="px-8 py-6 bg-gray-50 border-b">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, stepIdx) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <li key={step.name} className="flex items-center">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                        isCurrent ? 'bg-blue-50 border-blue-600 text-blue-600' :
                        'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircleIcon className="h-6 w-6" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className={`ml-3 text-sm font-medium transition-colors ${
                        isCurrent ? 'text-blue-600' : 
                        isCompleted ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                    {stepIdx < steps.length - 1 && (
                      <div className={`ml-8 w-12 h-0.5 transition-colors ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="px-8 py-8 max-h-96 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepValid(currentStep)}
                className="flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Create Listing
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

export default PropertyListingWizard;
