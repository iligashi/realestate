import React, { useState, useEffect } from 'react';
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

const SavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([
    {
      id: 1,
      name: 'Downtown Condos',
      filters: {
        location: 'Downtown',
        propertyType: 'condo',
        minPrice: 300000,
        maxPrice: 500000,
        bedrooms: 2
      },
      notifications: true,
      lastSearch: '2024-01-15',
      resultsCount: 12,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'Family Homes Suburbs',
      filters: {
        location: 'Suburbs',
        propertyType: 'house',
        minPrice: 400000,
        maxPrice: 800000,
        bedrooms: 3,
        bathrooms: 2
      },
      notifications: true,
      lastSearch: '2024-01-14',
      resultsCount: 8,
      createdAt: '2024-01-05'
    },
    {
      id: 3,
      name: 'Luxury Properties',
      filters: {
        location: 'Any',
        propertyType: 'any',
        minPrice: 1000000,
        maxPrice: 5000000,
        bedrooms: 4
      },
      notifications: false,
      lastSearch: '2024-01-10',
      resultsCount: 5,
      createdAt: '2024-01-08'
    }
  ]);

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

  const handleCreateSearch = () => {
    if (!searchForm.name.trim()) {
      toast.error('Please enter a search name');
      return;
    }

    const newSearch = {
      id: Date.now(),
      name: searchForm.name,
      filters: {
        location: searchForm.location,
        propertyType: searchForm.propertyType,
        minPrice: searchForm.minPrice ? parseInt(searchForm.minPrice) : null,
        maxPrice: searchForm.maxPrice ? parseInt(searchForm.maxPrice) : null,
        bedrooms: searchForm.bedrooms ? parseInt(searchForm.bedrooms) : null,
        bathrooms: searchForm.bathrooms ? parseInt(searchForm.bathrooms) : null
      },
      notifications: searchForm.notifications,
      lastSearch: new Date().toISOString().split('T')[0],
      resultsCount: Math.floor(Math.random() * 20) + 1,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setSavedSearches(prev => [newSearch, ...prev]);
    setShowCreateModal(false);
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
    toast.success('Search saved successfully!');
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

  const handleUpdateSearch = () => {
    if (!searchForm.name.trim()) {
      toast.error('Please enter a search name');
      return;
    }

    setSavedSearches(prev => prev.map(search => 
      search.id === editingSearch.id 
        ? {
            ...search,
            name: searchForm.name,
            filters: {
              location: searchForm.location,
              propertyType: searchForm.propertyType,
              minPrice: searchForm.minPrice ? parseInt(searchForm.minPrice) : null,
              maxPrice: searchForm.maxPrice ? parseInt(searchForm.maxPrice) : null,
              bedrooms: searchForm.bedrooms ? parseInt(searchForm.bedrooms) : null,
              bathrooms: searchForm.bathrooms ? parseInt(searchForm.bathrooms) : null
            },
            notifications: searchForm.notifications,
            lastSearch: new Date().toISOString().split('T')[0],
            resultsCount: Math.floor(Math.random() * 20) + 1
          }
        : search
    ));

    setShowCreateModal(false);
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
    toast.success('Search updated successfully!');
  };

  const handleDeleteSearch = (searchId) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    toast.success('Search deleted successfully!');
  };

  const handleToggleNotifications = (searchId) => {
    setSavedSearches(prev => prev.map(search => 
      search.id === searchId 
        ? { ...search, notifications: !search.notifications }
        : search
    ));
    toast.success('Notification settings updated!');
  };

  const handleRunSearch = (search) => {
    // This would navigate to the property browser with the saved filters
    toast.success(`Running search: ${search.name}`);
    // In a real app, this would navigate to the property browser with filters applied
  };

  const formatDate = (dateString) => {
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
            onClick={() => handleToggleNotifications(search.id)}
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
      {savedSearches.length === 0 ? (
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {editingSearch ? 'Update Search' : 'Create Search'}
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
