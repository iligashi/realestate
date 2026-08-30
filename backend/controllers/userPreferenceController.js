const { randomUUID } = require('crypto');

const ensurePreferencesShape = (preferences = {}) => {
  const normalized = { ...preferences };
  if (!Array.isArray(normalized.savedSearches)) {
    normalized.savedSearches = [];
  }
  if (!Array.isArray(normalized.propertyAlerts)) {
    normalized.propertyAlerts = [];
  }
  return normalized;
};

const persistPreferences = async (user, preferences) => {
  await user.update({ preferences });
  return ensurePreferencesShape(user.preferences);
};

const getSavedSearches = async (req, res) => {
  try {
    const preferences = ensurePreferencesShape(req.user.preferences);
    res.json({
      success: true,
      savedSearches: preferences.savedSearches
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load saved searches',
      error: error.message
    });
  }
};

const createSavedSearch = async (req, res) => {
  try {
    const {
      name,
      location = '',
      propertyType = '',
      minPrice = null,
      maxPrice = null,
      bedrooms = null,
      bathrooms = null,
      notifications = true
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Saved search name is required'
      });
    }

    const preferences = ensurePreferencesShape(req.user.preferences);
    const newSearch = {
      id: randomUUID(),
      name: name.trim(),
      filters: {
        location: location || '',
        propertyType: propertyType || '',
        minPrice: minPrice !== null ? Number(minPrice) : null,
        maxPrice: maxPrice !== null ? Number(maxPrice) : null,
        bedrooms: bedrooms !== null ? Number(bedrooms) : null,
        bathrooms: bathrooms !== null ? Number(bathrooms) : null
      },
      notifications: Boolean(notifications),
      lastSearch: null,
      resultsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    preferences.savedSearches.unshift(newSearch);
    await persistPreferences(req.user, preferences);

    res.status(201).json({
      success: true,
      message: 'Saved search created successfully',
      savedSearch: newSearch,
      savedSearches: preferences.savedSearches
    });
  } catch (error) {
    console.error('Create saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create saved search',
      error: error.message
    });
  }
};

const updateSavedSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const updates = req.body;

    const preferences = ensurePreferencesShape(req.user.preferences);
    const index = preferences.savedSearches.findIndex(search => search.id === searchId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found'
      });
    }

    const current = preferences.savedSearches[index];
    const updatedSearch = {
      ...current,
      name: updates.name !== undefined ? updates.name : current.name,
      filters: {
        location: updates.location !== undefined ? updates.location : current.filters.location,
        propertyType: updates.propertyType !== undefined ? updates.propertyType : current.filters.propertyType,
        minPrice: updates.minPrice !== undefined ? Number(updates.minPrice) : current.filters.minPrice,
        maxPrice: updates.maxPrice !== undefined ? Number(updates.maxPrice) : current.filters.maxPrice,
        bedrooms: updates.bedrooms !== undefined ? Number(updates.bedrooms) : current.filters.bedrooms,
        bathrooms: updates.bathrooms !== undefined ? Number(updates.bathrooms) : current.filters.bathrooms
      },
      notifications: updates.notifications !== undefined ? Boolean(updates.notifications) : current.notifications,
      lastSearch: updates.lastSearch !== undefined ? updates.lastSearch : current.lastSearch,
      resultsCount: updates.resultsCount !== undefined ? Number(updates.resultsCount) : current.resultsCount,
      updatedAt: new Date().toISOString()
    };

    preferences.savedSearches[index] = updatedSearch;
    await persistPreferences(req.user, preferences);

    res.json({
      success: true,
      message: 'Saved search updated successfully',
      savedSearch: updatedSearch,
      savedSearches: preferences.savedSearches
    });
  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saved search',
      error: error.message
    });
  }
};

const deleteSavedSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const preferences = ensurePreferencesShape(req.user.preferences);
    const initialLength = preferences.savedSearches.length;

    preferences.savedSearches = preferences.savedSearches.filter(search => search.id !== searchId);

    if (preferences.savedSearches.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found'
      });
    }

    await persistPreferences(req.user, preferences);

    res.json({
      success: true,
      message: 'Saved search deleted successfully',
      savedSearches: preferences.savedSearches
    });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved search',
      error: error.message
    });
  }
};

const getPropertyAlerts = async (req, res) => {
  try {
    const preferences = ensurePreferencesShape(req.user.preferences);
    res.json({
      success: true,
      propertyAlerts: preferences.propertyAlerts
    });
  } catch (error) {
    console.error('Get property alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load property alerts',
      error: error.message
    });
  }
};

const createPropertyAlert = async (req, res) => {
  try {
    const {
      name,
      location = '',
      propertyType = '',
      minPrice = null,
      maxPrice = null,
      bedrooms = null,
      bathrooms = null,
      frequency = 'daily',
      isActive = true
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alert name is required'
      });
    }

    const preferences = ensurePreferencesShape(req.user.preferences);
    const newAlert = {
      id: randomUUID(),
      name: name.trim(),
      criteria: {
        location: location || '',
        propertyType: propertyType || '',
        minPrice: minPrice !== null ? Number(minPrice) : null,
        maxPrice: maxPrice !== null ? Number(maxPrice) : null,
        bedrooms: bedrooms !== null ? Number(bedrooms) : null,
        bathrooms: bathrooms !== null ? Number(bathrooms) : null
      },
      frequency,
      isActive: Boolean(isActive),
      matchesCount: 0,
      lastSent: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    preferences.propertyAlerts.unshift(newAlert);
    await persistPreferences(req.user, preferences);

    res.status(201).json({
      success: true,
      message: 'Property alert created successfully',
      propertyAlert: newAlert,
      propertyAlerts: preferences.propertyAlerts
    });
  } catch (error) {
    console.error('Create property alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property alert',
      error: error.message
    });
  }
};

const updatePropertyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const updates = req.body;

    const preferences = ensurePreferencesShape(req.user.preferences);
    const index = preferences.propertyAlerts.findIndex(alert => alert.id === alertId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Property alert not found'
      });
    }

    const current = preferences.propertyAlerts[index];
    const updatedAlert = {
      ...current,
      name: updates.name !== undefined ? updates.name : current.name,
      criteria: {
        location: updates.location !== undefined ? updates.location : current.criteria.location,
        propertyType: updates.propertyType !== undefined ? updates.propertyType : current.criteria.propertyType,
        minPrice: updates.minPrice !== undefined ? Number(updates.minPrice) : current.criteria.minPrice,
        maxPrice: updates.maxPrice !== undefined ? Number(updates.maxPrice) : current.criteria.maxPrice,
        bedrooms: updates.bedrooms !== undefined ? Number(updates.bedrooms) : current.criteria.bedrooms,
        bathrooms: updates.bathrooms !== undefined ? Number(updates.bathrooms) : current.criteria.bathrooms
      },
      frequency: updates.frequency || current.frequency,
      isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : current.isActive,
      matchesCount: updates.matchesCount !== undefined ? Number(updates.matchesCount) : current.matchesCount,
      lastSent: updates.lastSent !== undefined ? updates.lastSent : current.lastSent,
      updatedAt: new Date().toISOString()
    };

    preferences.propertyAlerts[index] = updatedAlert;
    await persistPreferences(req.user, preferences);

    res.json({
      success: true,
      message: 'Property alert updated successfully',
      propertyAlert: updatedAlert,
      propertyAlerts: preferences.propertyAlerts
    });
  } catch (error) {
    console.error('Update property alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property alert',
      error: error.message
    });
  }
};

const deletePropertyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const preferences = ensurePreferencesShape(req.user.preferences);
    const initialLength = preferences.propertyAlerts.length;

    preferences.propertyAlerts = preferences.propertyAlerts.filter(alert => alert.id !== alertId);

    if (preferences.propertyAlerts.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Property alert not found'
      });
    }

    await persistPreferences(req.user, preferences);

    res.json({
      success: true,
      message: 'Property alert deleted successfully',
      propertyAlerts: preferences.propertyAlerts
    });
  } catch (error) {
    console.error('Delete property alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property alert',
      error: error.message
    });
  }
};

module.exports = {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getPropertyAlerts,
  createPropertyAlert,
  updatePropertyAlert,
  deletePropertyAlert
};

