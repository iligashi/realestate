import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import ModernRentalApplicationForm from './Renter/ModernRentalApplicationForm';
import MessageModal from './MessageModal';
import ViewingModal from './ViewingModal';
import rentalApplicationAPI from '../services/rentalApplicationAPI';

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth || {});
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showViewingModal, setShowViewingModal] = useState(false);

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  const getPropertyTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Check if property is for rent
  const isRentalProperty = property && property.listingType === 'rental';

  // Handle rental application submission
  const handleApplicationSubmit = async (applicationData) => {
    try {
      await rentalApplicationAPI.createApplication(property._id, applicationData);
      toast.success('Rental application submitted successfully!');
      setShowApplicationModal(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  };

  // Handle apply for rental button click
  const handleApplyForRental = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to apply for rental');
      navigate('/login');
      return;
    }

    // Check if user is trying to apply for their own property
    if (property && property.owner && user && property.owner._id === user._id) {
      toast.error('You cannot apply for your own property');
      return;
    }

    setShowApplicationModal(true);
  };

  // Handle message button click
  const handleMessage = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to message the property owner');
      navigate('/login');
      return;
    }

    // Check if user is trying to message themselves
    if (property && property.owner && user && property.owner._id === user._id) {
      toast.error('You cannot message yourself about your own property');
      return;
    }

    setShowMessageModal(true);
  };

  // Handle viewing button click
  const handleViewing = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to schedule a viewing');
      navigate('/login');
      return;
    }

    // Check if user is trying to schedule viewing for their own property
    if (property && property.owner && user && property.owner._id === user._id) {
      toast.error('You cannot schedule a viewing for your own property');
      return;
    }

    setShowViewingModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {property.photos && property.photos.length > 0 ? (
          <img
            src={property.photos[0].url}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        {property.status && (
          <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
            property.status === 'active' ? 'bg-green-100 text-green-800' :
            property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            property.status === 'sold' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {property.title}
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        {/* Property Type and Location */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {getPropertyTypeLabel(property.propertyType)}
          </span>
          <span className="mx-2">•</span>
          <span>{property.address?.city}, {property.address?.state}</span>
        </div>

        {/* Property Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {property.details?.bedrooms && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              {property.details.bedrooms} bed
            </span>
          )}
          {property.details?.bathrooms && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              {property.details.bathrooms} bath
            </span>
          )}
          {property.details?.squareMeters && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {property.details.squareMeters} m²
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-green-600">
            {formatPrice(property.price, property.currency)}
            {isRentalProperty && (
              <span className="text-sm text-gray-500 font-normal">/month</span>
            )}
          </span>
          
          <Link
            to={`/properties/${property._id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
          >
            View Details
          </Link>
        </div>

        {/* Rental Application Actions */}
        {isRentalProperty && (
          <div className="space-y-2">
            <button
              onClick={handleApplyForRental}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Apply for Rent
            </button>
            <div className="flex gap-2">
              <button 
                onClick={handleMessage}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-3 w-3" />
                Message
              </button>
              <button 
                onClick={handleViewing}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <CalendarIcon className="h-3 w-3" />
                Viewing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rental Application Modal */}
      {isRentalProperty && (
        <ModernRentalApplicationForm
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          property={property}
          onSubmit={handleApplicationSubmit}
        />
      )}

      {/* Message Modal */}
      {property && property.owner && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          property={property}
          seller={property.owner}
        />
      )}

      {/* Viewing Modal */}
      {showViewingModal && (
        <ViewingModal
          isOpen={showViewingModal}
          onClose={() => setShowViewingModal(false)}
          property={property}
        />
      )}
    </div>
  );
};

export default PropertyCard;
