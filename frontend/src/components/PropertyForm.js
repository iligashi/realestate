import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const PropertyForm = ({ onSubmit, initialData = null, isEditing = false, isSubmitting = false }) => {
  const [amenities, setAmenities] = useState(initialData?.amenities || []);
  const [newAmenity, setNewAmenity] = useState('');
  const [images, setImages] = useState(initialData?.photos || []);
  const [imageFiles, setImageFiles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger
  } = useForm({
    defaultValues: initialData || {
      title: '',
      propertyType: 'apartment',
      description: '',
      price: '',
      currency: 'USD',
      status: 'pending',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      details: {
        bedrooms: '',
        bathrooms: '',
        squareMeters: '',
        yearBuilt: 2025
      },
      features: {
        parkingAvailable: false,
        furnished: false,
        petFriendly: false,
        featured: false
      }
    }
  });

  // Watch form values for real-time validation
  const watchedValues = watch();

  // Real-time validation function
  const validateField = async (fieldName) => {
    await trigger(fieldName);
  };

  // Validate amenities and photos
  const validateAmenitiesAndPhotos = () => {
    let isValid = true;
    
    if (amenities.length === 0) {
      toast.error('At least one amenity is required');
      isValid = false;
    }
    
    if (images.length === 0) {
      toast.error('At least one image is required');
      isValid = false;
    }
    
    return isValid;
  };

  // Validation rules with helpful messages
  const validationRules = {
    title: {
      required: 'Property title is required',
      minLength: { value: 10, message: 'Title must be at least 10 characters long' },
      maxLength: { value: 200, message: 'Title must be less than 200 characters' }
    },
    description: {
      required: 'Description is required',
      minLength: { value: 50, message: 'Description must be at least 50 characters long' },
      maxLength: { value: 5000, message: 'Description must be less than 5000 characters' }
    },
    price: {
      required: 'Price is required',
      min: { value: 0.01, message: 'Price must be greater than 0' },
      pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Price must be a valid number' }
    },
    'address.city': {
      required: 'City is required'
    },
    'details.bedrooms': {
      required: 'Number of bedrooms is required',
      min: { value: 0, message: 'Bedrooms cannot be negative' },
      pattern: { value: /^\d+$/, message: 'Bedrooms must be a whole number' }
    },
    'details.bathrooms': {
      required: 'Number of bathrooms is required',
      min: { value: 0, message: 'Bathrooms cannot be negative' },
      pattern: { value: /^\d+$/, message: 'Bathrooms must be a whole number' }
    },
    'details.squareMeters': {
      required: 'Area is required',
      min: { value: 0, message: 'Area cannot be negative' },
      pattern: { value: /^\d+$/, message: 'Area must be a whole number' }
    },
    'details.yearBuilt': {
      required: 'Year built is required',
      min: { value: 1800, message: 'Year built must be at least 1800' },
      max: { value: 2030, message: 'Year built cannot be in the future' },
      pattern: { value: /^\d{4}$/, message: 'Year must be a 4-digit number' }
    }
  };

  // Simplified property types - only the three needed
  const propertyTypes = ['apartment', 'house', 'office'];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'];
  const statuses = ['draft', 'pending', 'active', 'sold', 'rented', 'inactive', 'under-contract'];

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  // Handle multiple image uploads
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    // Create preview URLs for new images
    const newImagePreviews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      caption: file.name,
      isPrimary: images.length === 0, // First image is primary
      order: images.length + 1,
      file: file // Store the actual file for upload
    }));

    // Update existing images order
    const updatedImages = images.map((img, index) => ({
      ...img,
      order: index + 1,
      isPrimary: index === 0
    }));

    setImages([...updatedImages, ...newImagePreviews]);
    setImageFiles([...imageFiles, ...validFiles]);
  };

  // Remove image
  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    
    // Reorder and set primary
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      order: i + 1,
      isPrimary: i === 0
    }));
    
    setImages(reorderedImages);
    setImageFiles(updatedFiles);
  };

  // Set primary image
  const setPrimaryImage = (index) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setImages(updatedImages);
  };

  // Reorder images
  const moveImage = (fromIndex, toIndex) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    // Update order and primary
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      order: i + 1,
      isPrimary: i === 0
    }));
    
    setImages(reorderedImages);
  };

  const handleFormSubmit = async (data) => {
    try {
      // Validate all required fields before submission
      let hasErrors = false;
      
      // Check title length
      if (!data.title || data.title.length < 10) {
        toast.error('Title must be at least 10 characters long');
        hasErrors = true;
      }
      
      // Check description length
      if (!data.description || data.description.length < 50) {
        toast.error('Description must be at least 50 characters long');
        hasErrors = true;
      }
      
      // Check price
      if (!data.price || data.price <= 0) {
        toast.error('Price must be greater than 0');
        hasErrors = true;
      }
      
      // Check city
      if (!data.address?.city) {
        toast.error('City is required');
        hasErrors = true;
      }
      
      // Check amenities
      if (amenities.length === 0) {
        toast.error('At least one amenity is required');
        hasErrors = true;
      }
      
      // Check images
      if (images.length === 0) {
        toast.error('At least one image is required');
        hasErrors = true;
      }
      
      // Check numeric fields
      if (!data.details?.bedrooms || data.details.bedrooms < 0) {
        toast.error('Number of bedrooms is required and must be 0 or more');
        hasErrors = true;
      }
      
      if (!data.details?.bathrooms || data.details.bathrooms < 0) {
        toast.error('Number of bathrooms is required and must be 0 or more');
        hasErrors = true;
      }
      
      if (!data.details?.squareMeters || data.details.squareMeters < 0) {
        toast.error('Area is required and must be 0 or more');
        hasErrors = true;
      }
      
      if (!data.details?.yearBuilt || data.details.yearBuilt < 1800 || data.details.yearBuilt > 2030) {
        toast.error('Year built must be between 1800 and 2030');
        hasErrors = true;
      }
      
      if (hasErrors) {
        return; // Stop submission if there are errors
      }

      const formData = {
        ...data,
        amenities,
        photos: images
      };

      await onSubmit(formData);
      toast.success(isEditing ? 'Property updated successfully!' : 'Property created successfully!');
      if (!isEditing) {
        reset();
        setAmenities([]);
        setImages([]);
        setImageFiles([]);
      }
    } catch (error) {
      toast.error('Failed to save property. Please try again.');
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Property' : 'Create New Property'}
        </h1>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
          onClick={() => window.history.back()}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Validation Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Form Requirements Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${watchedValues.title && watchedValues.title.length >= 10 ? 'bg-green-500' : 'bg-red-400'}`}></span>
              <span>Title: {watchedValues.title ? `${watchedValues.title.length}/10` : '0/10'} characters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${watchedValues.description && watchedValues.description.length >= 50 ? 'bg-green-500' : 'bg-red-400'}`}></span>
              <span>Description: {watchedValues.description ? `${watchedValues.description.length}/50` : '0/50'} characters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${watchedValues.price && watchedValues.price > 0 ? 'bg-green-500' : 'bg-red-400'}`}></span>
              <span>Price: {watchedValues.price && watchedValues.price > 0 ? '✓ Set' : 'Required'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${watchedValues.address?.city ? 'bg-green-500' : 'bg-red-400'}`}></span>
              <span>City: {watchedValues.address?.city ? '✓ Set' : 'Required'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${amenities.length > 0 ? 'bg-green-500' : 'bg-red-400'}`}></span>
              <span>Amenities: {amenities.length > 0 ? `✓ ${amenities.length} added` : 'At least 1 required'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${images.length > 0 ? 'bg-green-500' : 'bg-red-400'}`}></span>
              <span>Images: {images.length > 0 ? `✓ ${images.length} uploaded` : 'At least 1 required'}</span>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter property title (minimum 10 characters)"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('title', { required: 'Property title is required' })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {watchedValues.title ? `${watchedValues.title.length}/200 characters` : 'Minimum 10 characters required'}
              </p>
            </div>

            {/* Property Type - Simplified to only 3 types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('propertyType', { required: 'Property type is required' })}
              >
                {propertyTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the property... (minimum 50 characters)"
                rows={4}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                {...register('description', { required: 'Description is required' })}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {watchedValues.description ? `${watchedValues.description.length}/5000 characters` : 'Minimum 50 characters required'}
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter price"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('currency', { required: 'Currency is required' })}
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('status', { required: 'Status is required' })}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                placeholder="Street address"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('address.street')}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="City"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('address.city', { required: 'City is required' })}
              />
              {errors.address?.city && (
                <p className="text-red-500 text-sm mt-1">{errors.address.city.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                placeholder="State"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('address.state')}
              />
            </div>

            {/* ZIP Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                placeholder="ZIP Code"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('address.zipCode')}
              />
            </div>
          </div>
        </div>

        {/* Property Features Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.bedrooms', { required: 'Number of bedrooms is required', min: 0 })}
              />
              {errors.details?.bedrooms && (
                <p className="text-red-500 text-sm mt-1">{errors.details.bedrooms.message}</p>
              )}
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.bathrooms', { required: 'Number of bathrooms is required', min: 0 })}
              />
              {errors.details?.bathrooms && (
                <p className="text-red-500 text-sm mt-1">{errors.details.bathrooms.message}</p>
              )}
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.squareMeters', { required: 'Area is required', min: 0 })}
              />
              {errors.details?.squareMeters && (
                <p className="text-red-500 text-sm mt-1">{errors.details.squareMeters.message}</p>
              )}
            </div>

            {/* Year Built */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Built <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1800"
                max="2030"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.yearBuilt', { required: 'Year built is required', min: 1800, max: 2030 })}
              />
              {errors.details?.yearBuilt && (
                <p className="text-red-500 text-sm mt-1">{errors.details.yearBuilt.message}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="md:col-span-2">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                    {...register('features.parkingAvailable')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Parking Available</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                    {...register('features.furnished')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Furnished</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                    {...register('features.petFriendly')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Pet Friendly</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                    {...register('features.featured')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Property</span>
                </label>
              </div>
            </div>

            {/* Amenities */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add amenity"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  +
                </button>
              </div>
              
              {/* Display amenities */}
              {amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.amenities && (
                <p className="text-red-500 text-sm mt-1">{errors.amenities.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Images Section - Multiple Image Upload */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          {/* Image Upload Button */}
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 border-2 border-dashed border-green-300 rounded-md text-green-600 hover:border-green-400 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Add Images <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mt-2">You can select multiple images. The first image will be the primary image.</p>
            {errors.photos && (
              <p className="text-red-500 text-sm mt-1">{errors.photos.message}</p>
            )}
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={image.caption}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    
                    {/* Primary Image Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        Primary
                      </div>
                    )}
                    
                    {/* Order Number */}
                    <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                      {image.order}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Image Actions */}
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      disabled={image.isPrimary}
                      className={`text-xs px-2 py-1 rounded ${
                        image.isPrimary 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Set Primary
                    </button>
                    
                    {/* Move Up */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index - 1)}
                        className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
                      >
                        ↑
                      </button>
                    )}
                    
                    {/* Move Down */}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <div className="flex-1 text-sm text-gray-600">
            <p><strong>Required Fields:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Title: Minimum 10 characters</li>
              <li>Description: Minimum 50 characters</li>
              <li>Price: Must be greater than 0</li>
              <li>City: Required</li>
              <li>Amenities: At least one required</li>
              <li>Images: At least one required</li>
            </ul>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Property' : 'Create Property')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
