import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const PropertyForm = ({ onSubmit, initialData = null, isEditing = false }) => {
  const [amenities, setAmenities] = useState(initialData?.amenities || []);
  const [newAmenity, setNewAmenity] = useState('');
  const [images, setImages] = useState(initialData?.photos || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    defaultValues: initialData || {
      title: '',
      propertyType: 'apartment',
      description: '',
      price: 0,
      currency: 'USD',
      status: 'draft',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      details: {
        bedrooms: 0,
        bathrooms: 0,
        squareMeters: 0,
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

  const propertyTypes = [
    'apartment', 'house', 'condo', 'townhouse', 'land', 
    'commercial', 'industrial', 'office', 'retail', 'warehouse'
  ];

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

  const handleFormSubmit = async (data) => {
    try {
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
        {/* Basic Information Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title
              </label>
              <input
                type="text"
                placeholder="Enter property title"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('title', { required: 'Property title is required' })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
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
                Description
              </label>
              <textarea
                placeholder="Describe the property..."
                rows={4}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                {...register('description', { required: 'Description is required' })}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' }
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
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('status')}
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
                City
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
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.bedrooms', { min: 0 })}
              />
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.bathrooms', { min: 0 })}
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area (m²)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.squareMeters', { min: 0 })}
              />
            </div>

            {/* Year Built */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Built
              </label>
              <input
                type="number"
                min="1800"
                max="2030"
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                {...register('details.yearBuilt')}
              />
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
                Amenities
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
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          <button
            type="button"
            className="px-4 py-2 border-2 border-dashed border-green-300 rounded-md text-green-600 hover:border-green-400 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Add Image (Demo)
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
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
      </form>
    </div>
  );
};

export default PropertyForm;
