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
      console.log('Submitting property data with FormData');
      console.log('FormData received:', propertyData);
      console.log('FormData instanceof FormData:', propertyData instanceof FormData);
      
      // Validate that we received FormData
      if (!(propertyData instanceof FormData)) {
        toast.error('Invalid data format received');
        return;
      }
      
      // Log the contents of FormData for debugging
      for (let [key, value] of propertyData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Use Redux action to create property
      const result = await dispatch(createProperty(propertyData)).unwrap();
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
