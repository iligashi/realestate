import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import appointmentAPI from '../services/appointmentAPI';

const ViewingModal = ({ isOpen, onClose, property }) => {
  const { user } = useSelector(state => state.auth || {});
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    message: '',
    contactMethod: 'phone'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.preferredDate || !formData.preferredTime) {
      toast.error('Please select both date and time for the viewing');
      return;
    }

    setLoading(true);
    
    try {
      await appointmentAPI.createViewingRequest(property._id, {
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        message: formData.message,
        contactMethod: formData.contactMethod
      });
      
      toast.success('Viewing request sent successfully! The property owner will contact you soon.');
      onClose();
      
      // Reset form
      setFormData({
        preferredDate: '',
        preferredTime: '',
        message: '',
        contactMethod: 'phone'
      });
    } catch (error) {
      console.error('Error sending viewing request:', error);
      toast.error(error.message || 'Failed to send viewing request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
    '5:00 PM', '6:00 PM'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Schedule Property Viewing</h2>
              <p className="text-sm text-gray-600">Request a viewing for this property</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Property Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {property.photos && property.photos.length > 0 ? (
                <img
                  src={property.photos[0].url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPinIcon className="h-4 w-4" />
                <span>{property.address?.city}, {property.address?.state}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {property.details?.bedrooms && (
                  <span>{property.details.bedrooms} bed</span>
                )}
                {property.details?.bathrooms && (
                  <span>{property.details.bathrooms} bath</span>
                )}
                {property.details?.squareMeters && (
                  <span>{property.details.squareMeters} m²</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time *
              </label>
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="phone"
                    checked={formData.contactMethod === 'phone'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <PhoneIcon className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Phone Call</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="email"
                    checked={formData.contactMethod === 'email'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Email</span>
                </label>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Message (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any specific questions or requests for the viewing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Your Contact Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Viewing Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewingModal;
