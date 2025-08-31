import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PropertyForm from '../../components/PropertyForm';
import { createProperty } from '../../store/slices/propertySlice';
import { toast } from 'react-hot-toast';

const PropertyFormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.property);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a property');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (propertyData) => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a property');
      navigate('/login');
      return;
    }

    try {
      // Transform the data to match the backend schema and validation requirements
      const transformedData = {
        title: propertyData.title || '',
        description: propertyData.description || '',
        propertyType: propertyData.propertyType || 'apartment',
        listingType: 'sale', // Default to sale as required by validation
        price: parseFloat(propertyData.price) || 0,
        currency: propertyData.currency || 'USD',
        status: propertyData.status || 'pending',
        address: {
          street: propertyData.address?.street || '',
          city: propertyData.address?.city || '',
          state: propertyData.address?.state || '',
          zipCode: propertyData.address?.zipCode || '',
          country: 'US' // Required by validation
        },
        location: {
          type: 'Point',
          coordinates: [0, 0] // Default coordinates - required by schema
        },
        details: {
          bedrooms: parseInt(propertyData.details?.bedrooms) || 0,
          bathrooms: parseInt(propertyData.details?.bathrooms) || 0,
          squareMeters: parseInt(propertyData.details?.squareMeters) || 0,
          yearBuilt: parseInt(propertyData.details?.yearBuilt) || 2025
        },
        features: propertyData.amenities || [],
        amenities: propertyData.amenities || [],
        photos: propertyData.photos || []
      };

      console.log('Submitting property data:', transformedData);
      console.log('Raw form data:', propertyData);
      console.log('Amenities:', propertyData.amenities);
      console.log('Photos:', propertyData.photos);
      console.log('Features:', propertyData.features);
      console.log('User authenticated:', isAuthenticated);
      console.log('User:', user);
      
      // Validate required fields before sending
      if (!transformedData.title || transformedData.title.length < 10) {
        toast.error('Title must be at least 10 characters long');
        return;
      }
      
      if (!transformedData.description || transformedData.description.length < 50) {
        toast.error('Description must be at least 50 characters long');
        return;
      }
      
      if (!transformedData.address.city) {
        toast.error('City is required');
        return;
      }
      
      if (transformedData.price <= 0) {
        toast.error('Price must be greater than 0');
        return;
      }
      
      // Use Redux action instead of direct service call
      const result = await dispatch(createProperty(transformedData)).unwrap();
      console.log('Property created successfully:', result);
      
      toast.success('Property created successfully!');
      navigate('/properties'); // Redirect to properties list
      
    } catch (error) {
      console.error('Error creating property:', error);
      
      // Handle different types of errors
      if (error.message && error.message.includes('CORS')) {
        toast.error('Connection error. Please check if the backend server is running.');
      } else if (error.message && error.message.includes('401')) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else if (error.message && error.message.includes('403')) {
        toast.error('You are not authorized to create properties.');
      } else if (error.message && error.message.includes('Validation failed')) {
        toast.error('Please check all required fields and ensure they meet the requirements.');
      } else {
        toast.error(error.message || 'Failed to create property. Please try again.');
      }
      
      throw error; // Re-throw to let the form handle the error
    }
  };

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyForm onSubmit={handleSubmit} isSubmitting={loading} />
    </div>
  );
};

export default PropertyFormPage;
