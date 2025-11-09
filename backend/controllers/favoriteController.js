const { Favorite, Property, User } = require('../models');
const { Op } = require('sequelize');

const includePropertyDetails = [
  {
    model: Property,
    as: 'property',
    attributes: [
      'id',
      'title',
      'price',
      'currency',
      'propertyType',
      'listingType',
      'address',
      'photos',
      'details',
      'rentalDetails',
      'createdAt',
      'updatedAt'
    ],
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }
    ]
  }
];

const serializeFavorite = (favoriteInstance) => {
  const favorite = favoriteInstance.toJSON();

  const property = favorite.property || {};
  const parsedProperty = {
    ...property,
    _id: property.id ?? property._id,
    id: property.id ?? property._id,
    address: typeof property.address === 'string' ? safeParseJSON(property.address, {}) : property.address,
    photos: Array.isArray(property.photos)
      ? property.photos
      : safeParseJSON(property.photos, []),
    details: typeof property.details === 'string' ? safeParseJSON(property.details, {}) : property.details,
    rentalDetails: typeof property.rentalDetails === 'string' ? safeParseJSON(property.rentalDetails, {}) : property.rentalDetails,
    owner: property.owner || null,
  };

  return {
    id: favorite.id,
    favoriteId: favorite.id,
    propertyId: favorite.propertyId,
    userId: favorite.userId,
    savedAt: favorite.savedAt,
    notes: favorite.notes,
    priority: favorite.priority,
    tags: favorite.tags || [],
    alerts: favorite.alerts || {},
    priceTracking: favorite.priceTracking || {},
    comparisonData: favorite.comparisonData || {},
    reminders: favorite.reminders || [],
    analytics: favorite.analytics || {},
    sharing: favorite.sharing || {},
    viewHistory: favorite.viewHistory || [],
    property: parsedProperty
  };
};

const safeParseJSON = (value, fallback) => {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const getFavorites = async (req, res) => {
  try {
    const { filter, propertyType } = req.query;
    const whereClause = {
      userId: req.user.id
    };

    if (filter === 'highPriority') {
      whereClause.priority = { [Op.in]: ['high', 'urgent'] };
    }

    if (propertyType && propertyType !== 'all') {
      whereClause['$property.property_type$'] = propertyType;
    }

    const favorites = await Favorite.findAll({
      where: whereClause,
      include: includePropertyDetails,
      order: [['saved_at', 'DESC']]
    });

    res.json({
      success: true,
      favorites: favorites.map(serializeFavorite)
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load favorites',
      error: error.message
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      propertyId,
      notes = null,
      priority = 'medium',
      tags = [],
      alerts = null
    } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const [favorite, created] = await Favorite.findOrCreate({
      where: { userId, propertyId },
      defaults: {
        notes,
        priority,
        tags,
        alerts
      }
    });

    if (!created) {
      await favorite.update({
        notes: notes ?? favorite.notes,
        priority: priority ?? favorite.priority,
        tags: Array.isArray(tags) ? tags : favorite.tags,
        alerts: alerts ?? favorite.alerts
      });
    }

    const populatedFavorite = await Favorite.findByPk(favorite.id, {
      include: includePropertyDetails
    });

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Property added to favorites' : 'Favorite updated successfully',
      favorite: serializeFavorite(populatedFavorite)
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add property to favorites',
      error: error.message
    });
  }
};

const updateFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const userId = req.user.id;
    const { notes, priority, tags, alerts, reminders, comparisonData } = req.body;

    const favorite = await Favorite.findOne({
      where: { id: favoriteId, userId }
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    await favorite.update({
      ...(notes !== undefined && { notes }),
      ...(priority && { priority }),
      ...(Array.isArray(tags) && { tags }),
      ...(alerts !== undefined && { alerts }),
      ...(comparisonData !== undefined && { comparisonData }),
      ...(reminders !== undefined && { reminders })
    });

    const populatedFavorite = await Favorite.findByPk(favorite.id, {
      include: includePropertyDetails
    });

    res.json({
      success: true,
      message: 'Favorite updated successfully',
      favorite: serializeFavorite(populatedFavorite)
    });
  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update favorite',
      error: error.message
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const userId = req.user.id;

    const deleted = await Favorite.destroy({
      where: { id: favoriteId, userId }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Favorite removed successfully'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
      error: error.message
    });
  }
};

const removeFavoriteByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const deleted = await Favorite.destroy({
      where: { propertyId, userId }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Favorite removed successfully'
    });
  } catch (error) {
    console.error('Remove favorite by property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
      error: error.message
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  updateFavorite,
  removeFavorite,
  removeFavoriteByProperty
};

