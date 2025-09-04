import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const ViewingScheduler = () => {
  const [viewings, setViewings] = useState([
    {
      id: 1,
      property: {
        id: 'prop1',
        title: 'Modern Downtown Condo',
        address: '123 Main St, Downtown',
        image: '/api/placeholder/200/150'
      },
      seller: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567'
      },
      scheduledDate: '2024-01-20',
      scheduledTime: '14:00',
      duration: 60,
      status: 'scheduled',
      notes: 'Interested in the balcony view',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      property: {
        id: 'prop2',
        title: 'Family Home in Suburbs',
        address: '456 Oak Ave, Suburbs',
        image: '/api/placeholder/200/150'
      },
      seller: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '(555) 987-6543'
      },
      scheduledDate: '2024-01-18',
      scheduledTime: '10:00',
      duration: 90,
      status: 'completed',
      notes: 'Great neighborhood, need to check schools',
      createdAt: '2024-01-10'
    },
    {
      id: 3,
      property: {
        id: 'prop3',
        title: 'Luxury Penthouse',
        address: '789 High St, Uptown',
        image: '/api/placeholder/200/150'
      },
      seller: {
        name: 'Mike Davis',
        email: 'mike@example.com',
        phone: '(555) 456-7890'
      },
      scheduledDate: '2024-01-22',
      scheduledTime: '16:00',
      duration: 45,
      status: 'cancelled',
      notes: 'Cancelled due to scheduling conflict',
      createdAt: '2024-01-12'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingViewing, setEditingViewing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingForm, setViewingForm] = useState({
    propertyId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    notes: ''
  });

  const [properties] = useState([
    { id: 'prop1', title: 'Modern Downtown Condo', address: '123 Main St, Downtown' },
    { id: 'prop2', title: 'Family Home in Suburbs', address: '456 Oak Ave, Suburbs' },
    { id: 'prop3', title: 'Luxury Penthouse', address: '789 High St, Uptown' },
    { id: 'prop4', title: 'Cozy Townhouse', address: '321 Pine St, Midtown' }
  ]);

  const filteredViewings = viewings.filter(viewing => {
    if (filterStatus === 'all') return true;
    return viewing.status === filterStatus;
  });

  const handleCreateViewing = () => {
    if (!viewingForm.propertyId || !viewingForm.scheduledDate || !viewingForm.scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const property = properties.find(p => p.id === viewingForm.propertyId);
    const newViewing = {
      id: Date.now(),
      property: {
        ...property,
        image: '/api/placeholder/200/150'
      },
      seller: {
        name: 'Property Seller',
        email: 'seller@example.com',
        phone: '(555) 000-0000'
      },
      scheduledDate: viewingForm.scheduledDate,
      scheduledTime: viewingForm.scheduledTime,
      duration: viewingForm.duration,
      status: 'scheduled',
      notes: viewingForm.notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setViewings(prev => [newViewing, ...prev]);
    setShowCreateModal(false);
    setViewingForm({
      propertyId: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      notes: ''
    });
    toast.success('Viewing scheduled successfully!');
  };

  const handleEditViewing = (viewing) => {
    setEditingViewing(viewing);
    setViewingForm({
      propertyId: viewing.property.id,
      scheduledDate: viewing.scheduledDate,
      scheduledTime: viewing.scheduledTime,
      duration: viewing.duration,
      notes: viewing.notes
    });
    setShowCreateModal(true);
  };

  const handleUpdateViewing = () => {
    if (!viewingForm.propertyId || !viewingForm.scheduledDate || !viewingForm.scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const property = properties.find(p => p.id === viewingForm.propertyId);
    setViewings(prev => prev.map(viewing => 
      viewing.id === editingViewing.id 
        ? {
            ...viewing,
            property: {
              ...property,
              image: viewing.property.image
            },
            scheduledDate: viewingForm.scheduledDate,
            scheduledTime: viewingForm.scheduledTime,
            duration: viewingForm.duration,
            notes: viewingForm.notes
          }
        : viewing
    ));

    setShowCreateModal(false);
    setEditingViewing(null);
    setViewingForm({
      propertyId: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      notes: ''
    });
    toast.success('Viewing updated successfully!');
  };

  const handleCancelViewing = (viewingId) => {
    setViewings(prev => prev.map(viewing => 
      viewing.id === viewingId 
        ? { ...viewing, status: 'cancelled' }
        : viewing
    ));
    toast.success('Viewing cancelled successfully!');
  };

  const handleCompleteViewing = (viewingId) => {
    setViewings(prev => prev.map(viewing => 
      viewing.id === viewingId 
        ? { ...viewing, status: 'completed' }
        : viewing
    ));
    toast.success('Viewing marked as completed!');
  };

  const handleDeleteViewing = (viewingId) => {
    setViewings(prev => prev.filter(viewing => viewing.id !== viewingId));
    toast.success('Viewing deleted successfully!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <ClockIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled': return <XMarkIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const ViewingCard = ({ viewing }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{viewing.property.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{viewing.property.address}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(viewing.scheduledDate)}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatTime(viewing.scheduledTime)} ({viewing.duration} min)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewing.status)}`}>
            {getStatusIcon(viewing.status)}
            <span className="ml-1 capitalize">{viewing.status}</span>
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon className="h-4 w-4 mr-2" />
            <span>{viewing.seller.name}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/properties/${viewing.property.id}`, '_blank')}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="View property"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {viewing.status === 'scheduled' && (
              <>
                <button
                  onClick={() => handleEditViewing(viewing)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Edit viewing"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCancelViewing(viewing.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Cancel viewing"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </>
            )}
            {viewing.status === 'scheduled' && (
              <button
                onClick={() => handleCompleteViewing(viewing.id)}
                className="p-1 text-gray-400 hover:text-green-600"
                title="Mark as completed"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleDeleteViewing(viewing.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete viewing"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            <span>{viewing.seller.email}</span>
          </div>
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2" />
            <span>{viewing.seller.phone}</span>
          </div>
          {viewing.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Notes:</strong> {viewing.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Viewings</h2>
          <p className="text-gray-600">
            Schedule and manage your property viewings
          </p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Viewings</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button
            onClick={() => {
              setEditingViewing(null);
              setViewingForm({
                propertyId: '',
                scheduledDate: '',
                scheduledTime: '',
                duration: 60,
                notes: ''
              });
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Viewing
          </button>
        </div>
      </div>

      {/* Viewings List */}
      {filteredViewings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No viewings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus === 'all' 
              ? 'Schedule your first property viewing to get started.'
              : `No ${filterStatus} viewings found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredViewings.map((viewing) => (
            <ViewingCard key={viewing.id} viewing={viewing} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingViewing ? 'Edit Viewing' : 'Schedule New Viewing'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              editingViewing ? handleUpdateViewing() : handleCreateViewing();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property *
                  </label>
                  <select
                    value={viewingForm.propertyId}
                    onChange={(e) => setViewingForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} - {property.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={viewingForm.scheduledDate}
                      onChange={(e) => setViewingForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={viewingForm.scheduledTime}
                      onChange={(e) => setViewingForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    value={viewingForm.duration}
                    onChange={(e) => setViewingForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={viewingForm.notes}
                    onChange={(e) => setViewingForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Any specific questions or areas of interest..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {editingViewing ? 'Update Viewing' : 'Schedule Viewing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewingScheduler;
