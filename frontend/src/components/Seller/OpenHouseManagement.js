import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getOpenHouses, 
  createOpenHouse,
  updateOpenHouse,
  cancelOpenHouse,
  clearError 
} from '../../store/slices/sellerSlice';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const OpenHouseManagement = () => {
  const dispatch = useDispatch();
  const { 
    openHouses, 
    loading, 
    error 
  } = useSelector(state => state.seller);
  
  const [localLoading, setLocalLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const hasInitialized = useRef(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [viewType, setViewType] = useState('upcoming');
  const [formData, setFormData] = useState({
    property: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    duration: 120,
    type: 'open-house',
    maxAttendees: 20,
    isPublic: true,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    meetingPoint: '',
    parkingInfo: '',
    accessInstructions: '',
    virtualTour: {
      platform: '',
      link: '',
      password: '',
      instructions: ''
    }
  });

  useEffect(() => {
    let isMounted = true;
    const now = Date.now();
    
    // Only make initial request, don't re-run on every state change
    if (hasInitialized.current) {
      return;
    }
    
    // Circuit breaker - if too many requests, stop making new ones
    if (isCircuitOpen || requestCount > 10) {
      console.log('Circuit breaker open - stopping requests');
      setIsCircuitOpen(true);
      return;
    }
    
    // Throttle requests - only allow one request per 2 seconds
    if (now - lastRequestTime < 2000) {
      return;
    }
    
    const fetchOpenHouses = async () => {
      if (isMounted) {
        hasInitialized.current = true;
        setLastRequestTime(now);
        setRequestCount(prev => prev + 1);
        setLocalLoading(true);
        try {
          await dispatch(getOpenHouses(viewType)).unwrap();
          // Reset circuit breaker on success
          setRequestCount(0);
          setIsCircuitOpen(false);
        } catch (error) {
          console.error('Failed to fetch open houses:', error);
          // Open circuit breaker on repeated failures
          if (requestCount > 5) {
            setIsCircuitOpen(true);
          }
        } finally {
          if (isMounted) {
            setLocalLoading(false);
          }
        }
      }
    };

    fetchOpenHouses();

    return () => {
      isMounted = false;
    };
  }, [dispatch, viewType]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLocalLoading(true);
      if (editingHouse) {
        await dispatch(updateOpenHouse({
          id: editingHouse._id,
          openHouseData: formData
        })).unwrap();
        setEditingHouse(null);
      } else {
        await dispatch(createOpenHouse(formData)).unwrap();
      }
      
      setShowCreateForm(false);
      setFormData({
        property: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        duration: 120,
        type: 'open-house',
        maxAttendees: 20,
        isPublic: true,
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US'
        },
        meetingPoint: '',
        parkingInfo: '',
        accessInstructions: '',
        virtualTour: {
          platform: '',
          link: '',
          password: '',
          instructions: ''
        }
      });
      
      dispatch(getOpenHouses(viewType));
    } catch (error) {
      console.error('Failed to save open house:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = async (houseId, reason) => {
    try {
      setLocalLoading(true);
      await dispatch(cancelOpenHouse({
        id: houseId,
        reason
      })).unwrap();
      dispatch(getOpenHouses(viewType));
    } catch (error) {
      console.error('Failed to cancel open house:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'open-house': return <CalendarIcon className="h-5 w-5" />;
      case 'private-showing': return <EyeIcon className="h-5 w-5" />;
      case 'virtual-tour': return <UsersIcon className="h-5 w-5" />;
      case 'auction': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <CalendarIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Open House Management</h2>
        
        <div className="flex space-x-4">
          <select
            value={viewType}
            onChange={(e) => {
              setViewType(e.target.value);
              hasInitialized.current = false; // Reset initialization when view type changes
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          
          <button
            onClick={() => {
              hasInitialized.current = false;
              setRequestCount(0);
              setIsCircuitOpen(false);
              setLastRequestTime(0);
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Open House
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingHouse) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingHouse ? 'Edit Open House' : 'Schedule New Open House'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingHouse(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property *
                  </label>
                  <select
                    value={formData.property}
                    onChange={(e) => handleInputChange('property', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Property</option>
                    {/* This would be populated with user's properties */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="open-house">Open House</option>
                    <option value="private-showing">Private Showing</option>
                    <option value="virtual-tour">Virtual Tour</option>
                    <option value="auction">Auction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Weekend Open House"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the open house event..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxAttendees}
                    onChange={(e) => handleInputChange('maxAttendees', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Point
                  </label>
                  <input
                    type="text"
                    value={formData.meetingPoint}
                    onChange={(e) => handleInputChange('meetingPoint', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Front entrance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Information
                  </label>
                  <input
                    type="text"
                    value={formData.parkingInfo}
                    onChange={(e) => handleInputChange('parkingInfo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Street parking available"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Instructions
                </label>
                <textarea
                  value={formData.accessInstructions}
                  onChange={(e) => handleInputChange('accessInstructions', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special instructions for attendees..."
                />
              </div>

              {formData.type === 'virtual-tour' && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Virtual Tour Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform
                      </label>
                      <select
                        value={formData.virtualTour.platform}
                        onChange={(e) => handleInputChange('virtualTour.platform', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Platform</option>
                        <option value="zoom">Zoom</option>
                        <option value="google-meet">Google Meet</option>
                        <option value="teams">Microsoft Teams</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meeting Link
                      </label>
                      <input
                        type="url"
                        value={formData.virtualTour.link}
                        onChange={(e) => handleInputChange('virtualTour.link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password (if required)
                      </label>
                      <input
                        type="text"
                        value={formData.virtualTour.password}
                        onChange={(e) => handleInputChange('virtualTour.password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={formData.virtualTour.instructions}
                        onChange={(e) => handleInputChange('virtualTour.instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Download app before joining"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Make this event public
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingHouse(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={localLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {localLoading ? 'Saving...' : (editingHouse ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Houses List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {viewType === 'upcoming' ? 'Upcoming Open Houses' : 'Past Open Houses'}
          </h3>
          
          {isCircuitOpen ? (
            <div className="text-center py-12">
              <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Too Many Requests</h3>
              <p className="text-gray-600 mb-4">
                We're experiencing high traffic. Please wait a moment and refresh the page.
              </p>
              <button
                onClick={() => {
                  setIsCircuitOpen(false);
                  setRequestCount(0);
                  setLastRequestTime(0);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : localLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : openHouses.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No open houses</h3>
              <p className="mt-1 text-sm text-gray-500">
                {viewType === 'upcoming' 
                  ? 'Schedule your first open house to get started.'
                  : 'No past open houses found.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openHouses.map((house) => (
                <div key={house._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(house.type)}
                      <h4 className="font-medium text-gray-900">{house.title}</h4>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(house.status)}`}>
                      {house.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{formatDate(house.startDate)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>{formatTime(house.startDate)} - {formatTime(house.endDate)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span>{house.property?.address?.city}, {house.property?.address?.state}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      <span>{house.rsvps?.length || 0} / {house.maxAttendees} attendees</span>
                    </div>
                  </div>
                  
                  {house.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{house.description}</p>
                  )}
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => setEditingHouse(house)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    
                    {house.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancel(house._id, 'Cancelled by seller')}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenHouseManagement;
