import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  BellIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import buyerPreferenceAPI from '../../services/buyerPreferenceAPI';

const SavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState(null);
  const [searchForm, setSearchForm] = useState({
    name: '',
    location: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    notifications: true
  });

  const loadSavedSearches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await buyerPreferenceAPI.getSavedSearches();
      setSavedSearches(response.savedSearches || []);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      toast.error(error?.response?.data?.message || 'Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  const handleCreateSearch = async () => {
    if (!searchForm.name.trim()) {
      toast.error('Please enter a search name');
      return;
    }

    setProcessing(true);
    try {
      const response = await buyerPreferenceAPI.createSavedSearch({
        name: searchForm.name,
        location: searchForm.location,
        propertyType: searchForm.propertyType,
        minPrice: searchForm.minPrice ? Number(searchForm.minPrice) : null,
        maxPrice: searchForm.maxPrice ? Number(searchForm.maxPrice) : null,
        bedrooms: searchForm.bedrooms ? Number(searchForm.bedrooms) : null,
        bathrooms: searchForm.bathrooms ? Number(searchForm.bathrooms) : null,
        notifications: searchForm.notifications
      });

      setSavedSearches(response.savedSearches || []);
      setShowCreateModal(false);
      resetForm();
      toast.success('Search saved successfully!');
    } catch (error) {
      console.error('Create saved search error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save search');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSearch = (search) => {
    setEditingSearch(search);
    setSearchForm({
      name: search.name,
      location: search.filters.location || '',
      propertyType: search.filters.propertyType || '',
      minPrice: search.filters.minPrice || '',
      maxPrice: search.filters.maxPrice || '',
      bedrooms: search.filters.bedrooms || '',
      bathrooms: search.filters.bathrooms || '',
      notifications: search.notifications
    });
    setShowCreateModal(true);
  };

  const handleUpdateSearch = async () => {
    if (!searchForm.name.trim()) {
      toast.error('Please enter a search name');
      return;
    }

    setProcessing(true);
    try {
      const response = await buyerPreferenceAPI.updateSavedSearch(editingSearch.id, {
        name: searchForm.name,
        location: searchForm.location,
        propertyType: searchForm.propertyType,
        minPrice: searchForm.minPrice ? Number(searchForm.minPrice) : null,
        maxPrice: searchForm.maxPrice ? Number(searchForm.maxPrice) : null,
        bedrooms: searchForm.bedrooms ? Number(searchForm.bedrooms) : null,
        bathrooms: searchForm.bathrooms ? Number(searchForm.bathrooms) : null,
        notifications: searchForm.notifications
      });

      setSavedSearches(response.savedSearches || []);
      setShowCreateModal(false);
      setEditingSearch(null);
      resetForm();
      toast.success('Search updated successfully!');
    } catch (error) {
      console.error('Update saved search error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update search');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSearch = async (searchId) => {
    setProcessing(true);
    try {
      const response = await buyerPreferenceAPI.deleteSavedSearch(searchId);
      setSavedSearches(response.savedSearches || []);
      toast.success('Search deleted successfully!');
    } catch (error) {
      console.error('Delete saved search error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete search');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleNotifications = async (search) => {
    try {
      const response = await buyerPreferenceAPI.updateSavedSearch(search.id, {
        notifications: !search.notifications
      });
      setSavedSearches(response.savedSearches || []);
      toast.success('Notification settings updated!');
    } catch (error) {
      console.error('Toggle notifications error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update notifications');
    }
  };

  const handleRunSearch = async (search) => {
    toast.success(`Running search: ${search.name}`);
    try {
      const response = await buyerPreferenceAPI.updateSavedSearch(search.id, {
        lastSearch: new Date().toISOString(),
        resultsCount: search.resultsCount || 0
      });
      setSavedSearches(response.savedSearches || []);
    } catch (error) {
      console.error('Run search update error:', error);
    }
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
    if (price == null) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const resetForm = () => {
    setSearchForm({
      name: '',
      location: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      notifications: true
    });
  };

  const SearchCard = ({ search }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{search.name}</h3>
          <p className="text-sm text-gray-500">
            Last searched: {formatDate(search.lastSearch)} • {search.resultsCount} results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleNotifications(search)}
            className={`p-2 rounded-full ${
              search.notifications 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}
            title={search.notifications ? 'Notifications enabled' : 'Notifications disabled'}
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEditSearch(search)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
            title="Edit search"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteSearch(search.id)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
            title="Delete search"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {search.filters.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>{search.filters.location}</span>
          </div>
        )}
        
        {search.filters.propertyType && (
          <div className="flex items-center text-sm text-gray-600">
            <HomeIcon className="h-4 w-4 mr-2" />
            <span className="capitalize">{search.filters.propertyType}</span>
          </div>
        )}
        
        {(search.filters.minPrice || search.filters.maxPrice) && (
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            <span>
              {search.filters.minPrice && formatPrice(search.filters.minPrice)}
              {search.filters.minPrice && search.filters.maxPrice && ' - '}
              {search.filters.maxPrice && formatPrice(search.filters.maxPrice)}
            </span>
          </div>
        )}
        
        {(search.filters.bedrooms || search.filters.bathrooms) && (
          <div className="flex items-center text-sm text-gray-600">
            <span>
              {search.filters.bedrooms && `${search.filters.bedrooms} bed`}
              {search.filters.bedrooms && search.filters.bathrooms && ' • '}
              {search.filters.bathrooms && `${search.filters.bathrooms} bath`}
            </span>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => handleRunSearch(search)}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
          Run Search
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Searches</h2>
          <p className="text-gray-600">
            Manage your property search alerts and notifications
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingSearch(null);
            setSearchForm({
              name: '',
              location: '',
              propertyType: '',
              minPrice: '',
              maxPrice: '',
              bedrooms: '',
              bathrooms: '',
              notifications: true
            });
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Search
        </button>
      </div>

      {/* Search List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : savedSearches.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No saved searches</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first saved search to get notified about new properties.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSearches.map((search) => (
            <SearchCard key={search.id} search={search} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingSearch ? 'Edit Search' : 'Create New Search'}
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
              if (processing) return;
              editingSearch ? handleUpdateSearch() : handleCreateSearch();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Name *
                  </label>
                  <input
                    type="text"
                    value={searchForm.name}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Downtown Condos"
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
                      value={searchForm.location}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Downtown, Suburbs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select
                      value={searchForm.propertyType}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, propertyType: e.target.value }))}
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
                      value={searchForm.minPrice}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, minPrice: e.target.value }))}
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
                      value={searchForm.maxPrice}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, maxPrice: e.target.value }))}
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
                      value={searchForm.bedrooms}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, bedrooms: e.target.value }))}
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
                      value={searchForm.bathrooms}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, bathrooms: e.target.value }))}
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={searchForm.notifications}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                    Enable email notifications for new matches
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
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Saving...' : (editingSearch ? 'Update Search' : 'Create Search')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSearches;
