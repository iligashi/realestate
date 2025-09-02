import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PropertyForm from '../../components/PropertyForm';
import { createProperty, updateProperty } from '../../store/slices/propertySlice';
import { getProperty } from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const PropertyFormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.property);
  
  const [propertyData, setPropertyData] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const isEditing = Boolean(id);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a property');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch property data for editing
  useEffect(() => {
    const fetchPropertyForEdit = async () => {
      if (isEditing && id) {
        try {
          setLoadingProperty(true);
          const response = await getProperty(id);
          if (response && response.property) {
            setPropertyData(response.property);
          } else {
            toast.error('Property not found');
            navigate('/properties');
          }
        } catch (error) {
          console.error('Error fetching property:', error);
          toast.error('Failed to load property data');
          navigate('/properties');
        } finally {
          setLoadingProperty(false);
        }
      }
    };

    fetchPropertyForEdit();
  }, [isEditing, id, navigate]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (formData) => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a property');
      navigate('/login');
      return;
    }

    try {
      console.log('Submitting property data with FormData');
      console.log('FormData received:', formData);
      console.log('FormData instanceof FormData:', formData instanceof FormData);
      
      // Validate that we received FormData
      if (!(formData instanceof FormData)) {
        toast.error('Invalid data format received');
        return;
      }
      
      // Log the contents of FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      let result;
      if (isEditing) {
        // Use Redux action to update property
        result = await dispatch(updateProperty({ id, data: formData })).unwrap();
        console.log('Property updated successfully:', result);
        toast.success('Property updated successfully!');
      } else {
        // Use Redux action to create property
        result = await dispatch(createProperty(formData)).unwrap();
        console.log('Property created successfully:', result);
        toast.success('Property created successfully!');
      }
      
      navigate('/properties'); // Redirect to properties list
      
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} property:`, error);
      
      // Handle different types of errors
      if (error.message && error.message.includes('CORS')) {
        toast.error('Connection error. Please check if the backend server is running.');
      } else if (error.message && error.message.includes('401')) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else if (error.message && error.message.includes('403')) {
        toast.error(`You are not authorized to ${isEditing ? 'update' : 'create'} properties.`);
      } else if (error.message && error.message.includes('Validation failed')) {
        toast.error('Please check all required fields and ensure they meet the requirements.');
      } else {
        toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} property. Please try again.`);
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

  // Show loading while fetching property data for editing
  if (isEditing && loadingProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyForm 
        onSubmit={handleSubmit} 
        isSubmitting={loading} 
        isEditing={isEditing}
        initialData={propertyData}
      />
    </div>
  );
};

export default PropertyFormPage;
