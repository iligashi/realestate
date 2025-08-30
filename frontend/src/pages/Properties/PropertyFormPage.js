import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropertyForm from '../../components/PropertyForm';
import { createProperty } from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const PropertyFormPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (propertyData) => {
    try {
      // Transform the data to match the backend schema
      const transformedData = {
        title: propertyData.title,
        description: propertyData.description,
        propertyType: propertyData.propertyType,
        listingType: 'sale', // Default to sale
        price: propertyData.price,
        currency: propertyData.currency,
        status: propertyData.status,
        address: {
          street: propertyData.address.street,
          city: propertyData.address.city,
          state: propertyData.address.state,
          zipCode: propertyData.address.zipCode,
          country: 'US' // Default country
        },
        details: {
          bedrooms: propertyData.details.bedrooms,
          bathrooms: propertyData.details.bathrooms,
          squareMeters: propertyData.details.squareMeters,
          yearBuilt: propertyData.details.yearBuilt
        },
        features: propertyData.amenities,
        amenities: propertyData.amenities,
        photos: propertyData.photos || []
      };

      await createProperty(transformedData);
      toast.success('Property created successfully!');
      navigate('/properties'); // Redirect to properties list
      
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error(error.message || 'Failed to create property. Please try again.');
      throw error; // Re-throw to let the form handle the error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyForm onSubmit={handleSubmit} />
    </div>
  );
};

export default PropertyFormPage;
