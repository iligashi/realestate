const express = require('express');
const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Property = require('../models/Property');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
router.use(auth);

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.propertyId)
    ? next()
    : res.status(404).json({ error: 'Property not found.' });

// GET /api/favorites -> saved properties, newest first
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ savedAt: -1, createdAt: -1 })
      .populate('property', 'title price currency propertyType listingType status photos address details createdAt')
      .lean();

    // Skip favorites whose property was deleted
    const properties = favorites
      .filter((f) => f.property)
      .map((f) => ({ ...f.property, savedAt: f.savedAt || f.createdAt }));

    res.json({ properties });
  } catch (error) {
    logger.error('List favorites error:', error);
    res.status(500).json({ error: 'Failed to load your wishlist.' });
  }
});

// GET /api/favorites/ids -> just the ids, for showing filled hearts
router.get('/ids', async (req, res) => {
  try {
    const ids = await Favorite.find({ user: req.user._id }).distinct('property');
    res.json({ ids: ids.map(String) });
  } catch (error) {
    logger.error('List favorite ids error:', error);
    res.status(500).json({ error: 'Failed to load your wishlist.' });
  }
});

// POST /api/favorites/:propertyId -> save (idempotent)
router.post('/:propertyId', validId, async (req, res) => {
  try {
    const exists = await Property.exists({ _id: req.params.propertyId });
    if (!exists) return res.status(404).json({ error: 'Property not found.' });

    const result = await Favorite.updateOne(
      { user: req.user._id, property: req.params.propertyId },
      { $setOnInsert: { user: req.user._id, property: req.params.propertyId, savedAt: new Date() } },
      { upsert: true }
    );
    if (result.upsertedCount) {
      await Property.updateOne({ _id: req.params.propertyId }, { $inc: { 'analytics.saves': 1 } });
    }
    res.status(201).json({ saved: true });
  } catch (error) {
    logger.error('Save favorite error:', error);
    res.status(500).json({ error: 'Could not save this property.' });
  }
});

// DELETE /api/favorites/:propertyId -> remove
router.delete('/:propertyId', validId, async (req, res) => {
  try {
    const result = await Favorite.deleteOne({ user: req.user._id, property: req.params.propertyId });
    if (result.deletedCount) {
      await Property.updateOne({ _id: req.params.propertyId }, { $inc: { 'analytics.saves': -1 } });
    }
    res.json({ saved: false });
  } catch (error) {
    logger.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Could not remove this property.' });
  }
});

module.exports = router;
