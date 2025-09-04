import React, { useState, useEffect } from 'react';
import { 
  BellIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const PropertyAlerts = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      name: 'New Downtown Listings',
      criteria: {
        location: 'Downtown',
        propertyType: 'condo',
        minPrice: 300000,
        maxPrice: 500000,
        bedrooms: 2
      },
      frequency: 'daily',
      isActive: true,
      lastSent: '2024-01-15',
      matchesCount: 3,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'Family Homes Under $600k',
      criteria: {
        location: 'Suburbs',
        propertyType: 'house',
        maxPrice: 600000,
        bedrooms: 3,
        bathrooms: 2
      },
      frequency: 'weekly',
      isActive: true,
      lastSent: '2024-01-10',
      matchesCount: 7,
      createdAt: '2024-01-05'
    },
    {
      id: 3,
      name: 'Luxury Properties',
      criteria: {
        location: 'Any',
        propertyType: 'any',
        minPrice: 1000000,
        maxPrice: 5000000
      },
      frequency: 'immediate',
      isActive: false,
      lastSent: '2024-01-08',
      matchesCount: 2,
      createdAt: '2024-01-08'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [alertForm, setAlertForm] = useState({
    name: '',
    location: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    frequency: 'daily',
    isActive: true
  });

  const handleCreateAlert = () => {
    if (!alertForm.name.trim()) {
      toast.error('Please enter an alert name');
      return;
    }

    const newAlert = {
      id: Date.now(),
      name: alertForm.name,
      criteria: {
        location: alertForm.location,
        propertyType: alertForm.propertyType,
        minPrice: alertForm.minPrice ? parseInt(alertForm.minPrice) : null,
        maxPrice: alertForm.maxPrice ? parseInt(alertForm.maxPrice) : null,
        bedrooms: alertForm.bedrooms ? parseInt(alertForm.bedrooms) : null,
        bathrooms: alertForm.bathrooms ? parseInt(alertForm.bathrooms) : null
      },
      frequency: alertForm.frequency,
      isActive: alertForm.isActive,
      lastSent: null,
      matchesCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAlerts(prev => [newAlert, ...prev]);
    setShowCreateModal(false);
    setAlertForm({
      name: '',
      location: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      frequency: 'daily',
      isActive: true
    });
    toast.success('Alert created successfully!');
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setAlertForm({
      name: alert.name,
      location: alert.criteria.location || '',
      propertyType: alert.criteria.propertyType || '',
      minPrice: alert.criteria.minPrice || '',
      maxPrice: alert.criteria.maxPrice || '',
      bedrooms: alert.criteria.bedrooms || '',
      bathrooms: alert.criteria.bathrooms || '',
      frequency: alert.frequency,
      isActive: alert.isActive
    });
    setShowCreateModal(true);
  };

  const handleUpdateAlert = () => {
    if (!alertForm.name.trim()) {
      toast.error('Please enter an alert name');
      return;
    }

    setAlerts(prev => prev.map(alert => 
      alert.id === editingAlert.id 
        ? {
            ...alert,
            name: alertForm.name,
            criteria: {
              location: alertForm.location,
              propertyType: alertForm.propertyType,
              minPrice: alertForm.minPrice ? parseInt(alertForm.minPrice) : null,
              maxPrice: alertForm.maxPrice ? parseInt(alertForm.maxPrice) : null,
              bedrooms: alertForm.bedrooms ? parseInt(alertForm.bedrooms) : null,
              bathrooms: alertForm.bathrooms ? parseInt(alertForm.bathrooms) : null
            },
            frequency: alertForm.frequency,
            isActive: alertForm.isActive
          }
        : alert
    ));

    setShowCreateModal(false);
    setEditingAlert(null);
    setAlertForm({
      name: '',
      location: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      frequency: 'daily',
      isActive: true
    });
    toast.success('Alert updated successfully!');
  };

  const handleToggleAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
    toast.success('Alert status updated!');
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.success('Alert deleted successfully!');
  };

  const handleTestAlert = (alert) => {
    // This would trigger a test search with the alert criteria
    toast.success(`Testing alert: ${alert.name}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AlertCard = ({ alert }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{alert.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(alert.frequency)}`}>
              {alert.frequency}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {alert.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Last sent: {formatDate(alert.lastSent)} • {alert.matchesCount} matches
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleAlert(alert.id)}
            className={`p-2 rounded-full ${
              alert.isActive 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={alert.isActive ? 'Disable alert' : 'Enable alert'}
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleTestAlert(alert)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
            title="Test alert"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEditAlert(alert)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
            title="Edit alert"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteAlert(alert.id)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
            title="Delete alert"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {alert.criteria.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>{alert.criteria.location}</span>
          </div>
        )}
        
        {alert.criteria.propertyType && (
          <div className="flex items-center text-sm text-gray-600">
            <HomeIcon className="h-4 w-4 mr-2" />
            <span className="capitalize">{alert.criteria.propertyType}</span>
          </div>
        )}
        
        {(alert.criteria.minPrice || alert.criteria.maxPrice) && (
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            <span>
              {alert.criteria.minPrice && formatPrice(alert.criteria.minPrice)}
              {alert.criteria.minPrice && alert.criteria.maxPrice && ' - '}
              {alert.criteria.maxPrice && formatPrice(alert.criteria.maxPrice)}
            </span>
          </div>
        )}
        
        {(alert.criteria.bedrooms || alert.criteria.bathrooms) && (
          <div className="flex items-center text-sm text-gray-600">
            <span>
              {alert.criteria.bedrooms && `${alert.criteria.bedrooms} bed`}
              {alert.criteria.bedrooms && alert.criteria.bathrooms && ' • '}
              {alert.criteria.bathrooms && `${alert.criteria.bathrooms} bath`}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Alerts</h2>
          <p className="text-gray-600">
            Get notified when new properties match your criteria
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingAlert(null);
            setAlertForm({
              name: '',
              location: '',
              propertyType: '',
              minPrice: '',
              maxPrice: '',
              bedrooms: '',
              bathrooms: '',
              frequency: 'daily',
              isActive: true
            });
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Alert
        </button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts created</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first property alert to get notified about new listings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAlert ? 'Edit Alert' : 'Create New Alert'}
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
              editingAlert ? handleUpdateAlert() : handleCreateAlert();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Name *
                  </label>
                  <input
                    type="text"
                    value={alertForm.name}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Downtown Condos Under $500k"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={alertForm.location}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Downtown, Suburbs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select
                      value={alertForm.propertyType}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, propertyType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any Type</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Price
                    </label>
                    <input
                      type="number"
                      value={alertForm.minPrice}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, minPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="300000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Price
                    </label>
                    <input
                      type="number"
                      value={alertForm.maxPrice}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <select
                      value={alertForm.bedrooms}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, bedrooms: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <select
                      value={alertForm.bathrooms}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, bathrooms: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Frequency
                  </label>
                  <select
                    value={alertForm.frequency}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={alertForm.isActive}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Enable this alert
                  </label>
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
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyAlerts;
